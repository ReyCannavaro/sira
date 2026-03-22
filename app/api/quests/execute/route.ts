import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ok, badRequest, unauthorized } from '@/lib/api/response'
import vm from 'vm'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'

const execAsync = promisify(exec)

/* ── JavaScript execution via Node vm ─────────────────────────────── */
function executeJS(
  code: string,
  input: string,
  testCases: { input: string; expected_output: string }[]
): { outputs: string[]; hadSyntaxError: boolean; errorMsg: string } {

  const outputs: string[] = []

  // Determine inputs to run
  const inputs = testCases.length > 0
    ? testCases.map(tc => tc.input)
    : [input]

  // Build sandbox
  const sandbox = {
    console: { log: (...a: unknown[]) => {}, error: () => {}, warn: () => {} },
    Math, JSON, Array, Object, String, Number, Boolean, Date,
    parseInt, parseFloat, isNaN, isFinite,
    setTimeout: () => {}, clearTimeout: () => {},
    __outputs__: outputs,
  }

  // If no test_cases or empty input → just run code as-is
  if (testCases.length === 0) {
    const logs: string[] = []
    sandbox.console = {
      log: (...a: unknown[]) => logs.push(a.map(String).join(' ')),
      error: (...a: unknown[]) => logs.push(a.map(String).join(' ')),
      warn: (...a: unknown[]) => logs.push(a.map(String).join(' ')),
    }
    try {
      const ctx = vm.createContext(sandbox)
      vm.runInContext(code, ctx, { timeout: 5000 })
      outputs.push(logs.join('\n').trim())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      return { outputs: [msg], hadSyntaxError: true, errorMsg: msg }
    }
    return { outputs, hadSyntaxError: false, errorMsg: '' }
  }

  // Run all test cases in shared state (one vm context)
  const sharedLogs: string[] = []
  const sharedSandbox = {
    ...sandbox,
    console: {
      log: (...a: unknown[]) => sharedSandbox.__currentLogs__.push(a.map(String).join(' ')),
      error: (...a: unknown[]) => sharedSandbox.__currentLogs__.push(a.map(String).join(' ')),
      warn: () => {},
    },
    __currentLogs__: sharedLogs,
  }

  try {
    const ctx = vm.createContext(sharedSandbox)

    // Load user code first
    vm.runInContext(code, ctx, { timeout: 5000 })

    // Run each test case input
    for (let i = 0; i < inputs.length; i++) {
      const tcLogs: string[] = []
      ;(ctx as Record<string, unknown>).__currentLogs__ = tcLogs

      const tcInput = inputs[i].trim()
      if (!tcInput) { outputs.push(''); continue }

      try {
        // Parse input: if it looks like JS code, run it directly
        // Otherwise treat as args to main function
        const isCode = /[a-zA-Z_$][a-zA-Z0-9_$]*\s*[=(]/.test(tcInput) ||
                       tcInput.includes(';') || tcInput.includes('=>')

        if (isCode) {
          // Split by semicolons, run each statement, capture last result
          const stmts = tcInput.split(';').map(s => s.trim()).filter(Boolean)
          let lastResult: unknown
          for (const stmt of stmts) {
            lastResult = vm.runInContext(stmt, ctx, { timeout: 2000 })
          }
          if (lastResult !== undefined && lastResult !== null) {
            tcLogs.unshift(typeof lastResult === 'object'
              ? JSON.stringify(lastResult)
              : String(lastResult))
          } else if (tcLogs.length === 0) {
            // Function returned undefined (void) — use function name
            const fnName = tcInput.split('(')[0].trim().replace(/[^a-zA-Z0-9_$]/g, '')
            tcLogs.push(`${fnName} berhasil`)
          }
        } else {
          // Numeric/string args — find and call main function
          const fnMatch = code.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>))/)
          if (fnMatch) {
            const fnName = fnMatch[1] || fnMatch[2]
            const result = vm.runInContext(`${fnName}(${tcInput})`, ctx, { timeout: 2000 })
            if (result !== undefined && result !== null) {
              tcLogs.push(typeof result === 'object' ? JSON.stringify(result) : String(result))
            }
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        tcLogs.push(msg)
      }

      outputs.push(tcLogs[0]?.trim() ?? '')
    }

    // For test cases that expected fresh state (check against expected)
    // Re-run in fresh context and take result if it matches better
    for (let i = 0; i < testCases.length; i++) {
      const exp = (testCases[i].expected_output ?? '').trim()
      const shared = outputs[i] ?? ''
      if (shared.replace(/:\s+/g, ':').replace(/,\s+/g, ',') !== exp.replace(/:\s+/g, ':').replace(/,\s+/g, ',')) {
        // Try fresh
        try {
          const freshCtx = vm.createContext({ ...sandbox, console: { log: (...a: unknown[]) => freshLogs.push(a.map(String).join(' ')), error: () => {}, warn: () => {} } })
          const freshLogs: string[] = []
          ;(freshCtx as Record<string, unknown>).console = { log: (...a: unknown[]) => freshLogs.push(a.map(String).join(' ')), error: () => {}, warn: () => {} }
          vm.runInContext(code, freshCtx, { timeout: 5000 })
          const tcInput = inputs[i].trim()
          const stmts = tcInput.split(';').map((s: string) => s.trim()).filter(Boolean)
          let lastResult: unknown
          for (const stmt of stmts) {
            lastResult = vm.runInContext(stmt, freshCtx, { timeout: 2000 })
          }
          let freshOut = ''
          if (lastResult !== undefined && lastResult !== null) {
            freshOut = typeof lastResult === 'object' ? JSON.stringify(lastResult) : String(lastResult)
          } else if (freshLogs.length > 0) {
            freshOut = freshLogs[0]
          }
          const normFresh = freshOut.replace(/:\s+/g, ':').replace(/,\s+/g, ',')
          const normExp   = exp.replace(/:\s+/g, ':').replace(/,\s+/g, ',')
          if (normFresh === normExp) outputs[i] = freshOut
        } catch { /* keep shared */ }
      }
    }

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { outputs: [msg], hadSyntaxError: true, errorMsg: msg }
  }

  return { outputs, hadSyntaxError: false, errorMsg: '' }
}

/* ── Python execution via subprocess ──────────────────────────────── */
async function executePython(
  code: string,
  input: string,
  testCases: { input: string; expected_output: string }[]
): Promise<{ outputs: string[]; hadSyntaxError: boolean; errorMsg: string }> {

  const inputs = testCases.length > 0 ? testCases.map(tc => tc.input) : [input]
  const outputs: string[] = []

  for (const tcInput of inputs) {
    const tmpFile = join(tmpdir(), `sira_${randomBytes(8).toString('hex')}.py`)
    try {
      // Build Python runner
      let runner = code + '\n\n'
      if (tcInput.trim()) {
        runner += `try:\n    __r__ = ${tcInput.trim()}\n    if __r__ is not None:\n        import json\n        try:\n            print(json.dumps(__r__, ensure_ascii=False))\n        except:\n            print(__r__)\nexcept Exception as __e__:\n    print(type(__e__).__name__ + ': ' + str(__e__))\n`
      }
      await writeFile(tmpFile, runner, 'utf8')
      const { stdout, stderr } = await execAsync(`python3 "${tmpFile}"`, { timeout: 5000 })
      outputs.push((stdout || stderr || '').trim())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      outputs.push(msg)
      return { outputs, hadSyntaxError: true, errorMsg: msg }
    } finally {
      await unlink(tmpFile).catch(() => {})
    }
  }

  return { outputs, hadSyntaxError: false, errorMsg: '' }
}

/* ── POST /api/quests/execute ──────────────────────────────────────── */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Body tidak valid')

  const { code, language, input = '', test_cases = [], mode = 'preview' } = body

  if (!code) return badRequest('code wajib diisi')

  if (language === 'python') {
    const result = await executePython(code, input, test_cases)
    return ok(result)
  } else {
    const result = executeJS(code, input, test_cases)
    return ok(result)
  }
}