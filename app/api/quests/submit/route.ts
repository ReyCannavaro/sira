import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api/response'
import vm from 'vm'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'

const execAsync = promisify(exec)

function calcCleanCodeScore(code: string): number {
  let score = 100
  const lines = code.split('\n').filter(l => l.trim().length > 0)
  if (lines.length > 30) score -= 20
  else if (lines.length > 20) score -= 10
  const shortVarMatches = code.match(/\b(?:let|var|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g) ?? []
  const allowed = new Set(['i','j','k','n','x','y','a','b'])
  let badVarCount = 0
  for (const m of shortVarMatches) {
    const name = m.split(/\s+/).pop()
    if (name && name.length <= 2 && !allowed.has(name)) badVarCount++
  }
  score -= badVarCount * 10
  let maxDepth = 0, depth = 0
  for (const ch of code) {
    if (ch === '{') { depth++; if (depth > maxDepth) maxDepth = depth }
    if (ch === '}') depth = Math.max(0, depth - 1)
  }
  if (maxDepth > 4) score -= 20
  else if (maxDepth > 3) score -= 10
  return Math.max(0, Math.min(100, score))
}

function buildFeedback(status: string, actual: string, expected: string, lang: string): string {
  if (status === 'syntax_error') return lang === 'python'
    ? 'Ada kesalahan sintaks Python. Periksa indentasi dan penulisan kode.'
    : 'Ada kesalahan sintaks. Periksa kurung kurawal {} dan tanda kurung () sudah berpasangan.'
  if (status === 'logic_error') {
    const t = actual?.trim()
    if (!t) return 'Kode berjalan tapi tidak menghasilkan output. Pastikan sudah ada return atau print.'
    return `Output kamu adalah "${t}", tapi seharusnya "${expected.trim()}". Coba trace kodemu baris per baris.`
  }
  if (status === 'passed_dirty') return 'Quest selesai! Tapi ada ruang untuk kode yang lebih bersih.'
  if (status === 'passed_clean') return 'Luar biasa! Kode kamu bersih dan outputnya benar.'
  return ''
}

function normalize(s: string): string {
  return (s ?? '').trim().replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '')
    .replace(/:\s+/g, ':').replace(/,\s+/g, ',')
}

function normCompare(a: string, e: string): boolean {
  const na = normalize(a), ne = normalize(e)
  if (na === ne) return true
  try { if (Math.abs(parseFloat(na) - parseFloat(ne)) < 0.001) return true } catch {}
  return false
}

const normalizeHTML = (s: string) => (s ?? '').trim()
  .replace(/\r\n|\n|\r/g, '').replace(/\s+/g, ' ')
  .replace(/ </g, '<').replace(/> /g, '>').replace(/ >/g, '>')

const extractBody = (s: string) => {
  const lower = s.toLowerCase()
  const start = lower.indexOf('<body')
  const end   = lower.lastIndexOf('</body>')
  if (start !== -1 && end !== -1) { const e = s.indexOf('>', start); return s.slice(e + 1, end).trim() }
  return s
}

function makeDomMock() {
  const store: Record<string, unknown> = {}
  return {
    getElementById: (id: string) => ({
      id, style: {}, innerHTML: '', textContent: '',
      classList: {
        toggle: (c: string) => { store[id+'_'+c] = !store[id+'_'+c]; return store[id+'_'+c] },
        add: (c: string) => { store[id+'_'+c] = true },
        remove: (c: string) => { store[id+'_'+c] = false },
        contains: (c: string) => !!store[id+'_'+c],
      },
      addEventListener: (ev: string, fn: () => void) => { store['_ev_'+id+'_'+ev] = fn },
      click: () => { const f = store['_ev_'+id+'_click'] as (() => void) | undefined; if (f) f() },
    }),
    querySelector: () => ({ style: {}, innerHTML: '', textContent: '', classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false }, addEventListener: () => {} }),
    querySelectorAll: () => [],
    createElement: (t: string) => ({ tagName: t, style: {}, classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, addEventListener: () => {} }),
    body: { appendChild: () => {}, innerHTML: '' },
  }
}

function executeJS(code: string, testCases: { input: string; expected_output: string }[]): { outputs: string[]; hadSyntaxError: boolean } {
  const base = { Math, JSON, Array, Object, String, Number, Boolean, Date, parseInt, parseFloat, isNaN, isFinite }

  if (testCases.length === 0) {
    const logs: string[] = []
    try {
      vm.runInContext(code, vm.createContext({ ...base, console: { log: (...a: unknown[]) => logs.push(a.map(String).join(' ')), error: () => {}, warn: () => {} } }), { timeout: 5000 })
      return { outputs: [logs.join('\n').trim()], hadSyntaxError: false }
    } catch (e: unknown) {
      return { outputs: [e instanceof Error ? e.message : String(e)], hadSyntaxError: true }
    }
  }

  // Shared state
  const sharedOutputs: string[] = []
  let sharedCtx: vm.Context
  try {
    sharedCtx = vm.createContext({ ...base, console: { log: () => {}, error: () => {}, warn: () => {} }, document: makeDomMock(), window: {} })
    vm.runInContext(code, sharedCtx, { timeout: 5000 })
    for (const tc of testCases) {
      const logs: string[] = []
      ;(sharedCtx as Record<string, unknown>).console = { log: (...a: unknown[]) => logs.push(a.map(String).join(' ')), error: () => {}, warn: () => {} }
      try {
        const stmts = tc.input.split(';').map((s: string) => s.trim()).filter(Boolean)
        let last: unknown
        for (const s of stmts) last = vm.runInContext(s, sharedCtx, { timeout: 2000 })
        if (last !== undefined && last !== null) logs.unshift(typeof last === 'object' ? JSON.stringify(last) : String(last))
        else if (logs.length === 0) logs.push(tc.input.split('(')[0].trim() + ' berhasil')
      } catch (e: unknown) { logs.push(e instanceof Error ? e.message : String(e)) }
      sharedOutputs.push(logs[0]?.trim() ?? '')
    }
  } catch (e: unknown) {
    return { outputs: [e instanceof Error ? e.message : String(e)], hadSyntaxError: true }
  }

  // Per-TC fresh fallback
  const outputs: string[] = []
  for (let i = 0; i < testCases.length; i++) {
    const exp = normalize(testCases[i].expected_output ?? '')
    if (normCompare(sharedOutputs[i], exp)) { outputs.push(sharedOutputs[i]); continue }
    try {
      const freshLogs: string[] = []
      const freshCtx = vm.createContext({ ...base, console: { log: (...a: unknown[]) => freshLogs.push(a.map(String).join(' ')), error: () => {}, warn: () => {} }, document: makeDomMock(), window: {} })
      vm.runInContext(code, freshCtx, { timeout: 5000 })
      const stmts = testCases[i].input.split(';').map((s: string) => s.trim()).filter(Boolean)
      let last: unknown
      for (const s of stmts) last = vm.runInContext(s, freshCtx, { timeout: 2000 })
      let freshOut = freshLogs[0]?.trim() ?? ''
      if (last !== undefined && last !== null) freshOut = typeof last === 'object' ? JSON.stringify(last) : String(last)
      outputs.push(normCompare(freshOut, exp) ? freshOut : sharedOutputs[i])
    } catch { outputs.push(sharedOutputs[i]) }
  }
  return { outputs, hadSyntaxError: false }
}

async function executePython(code: string, testCases: { input: string; expected_output: string }[]): Promise<{ outputs: string[]; hadSyntaxError: boolean }> {
  const outputs: string[] = []
  const inputs = testCases.length > 0 ? testCases.map(tc => tc.input) : ['']
  for (const inp of inputs) {
    const f = join(tmpdir(), `sira_${randomBytes(8).toString('hex')}.py`)
    try {
      let runner = code + '\n\n'
      if (inp.trim()) runner += `try:\n    __r__ = ${inp.trim()}\n    if __r__ is not None:\n        import json\n        try:\n            print(json.dumps(__r__, ensure_ascii=False))\n        except:\n            print(__r__)\nexcept Exception as __e__:\n    print(type(__e__).__name__ + ': ' + str(__e__))\n`
      await writeFile(f, runner, 'utf8')
      const { stdout, stderr } = await execAsync(`python3 "${f}"`, { timeout: 5000 })
      outputs.push((stdout || stderr || '').trim())
    } catch (e: unknown) {
      outputs.push(e instanceof Error ? e.message : String(e))
      return { outputs, hadSyntaxError: true }
    } finally { await unlink(f).catch(() => {}) }
  }
  return { outputs, hadSyntaxError: false }
}

async function updateStreak(admin: ReturnType<typeof createSupabaseAdminClient>, userId: string, exp: number) {
  const today = new Date().toISOString().split('T')[0]
  await admin.from('streaks').upsert({ user_id: userId, activity_date: today, quests_done: 1, exp_earned: exp }, { onConflict: 'user_id,activity_date' })
  const { data } = await admin.from('streaks').select('activity_date').eq('user_id', userId).gte('activity_date', new Date(Date.now() - 30*86400000).toISOString().split('T')[0]).order('activity_date', { ascending: false })
  const dates = new Set((data ?? []).map((s: { activity_date: string }) => s.activity_date))
  let streak = 0, cur = new Date()
  while (dates.has(cur.toISOString().split('T')[0])) { streak++; cur = new Date(cur.getTime() - 86400000) }
  const { data: sr } = await admin.from('user_stats').select('longest_streak').eq('user_id', userId).single()
  return { currentStreak: streak, longestStreak: Math.max((sr as { longest_streak?: number } | null)?.longest_streak ?? 0, streak) }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()
  const admin = createSupabaseAdminClient()

  const body = await request.json().catch(() => null)
  if (!body) return badRequest('Body tidak valid')

  const { quest_id, submitted_code, hints_used_count = 0, duration_sec = 0 } = body
  if (!quest_id || !submitted_code) return badRequest('quest_id dan submitted_code wajib diisi')

  const { data: quest } = await supabase.from('quests').select('exp_reward,expected_output,test_cases,language').eq('id', quest_id).single()
  if (!quest) return badRequest('Quest tidak ditemukan')

  const q = quest as { exp_reward: number; expected_output: string; test_cases: { input: string; expected_output: string }[]; language: string }
  const expectedOutput = q.expected_output ?? ''
  const testCases = q.test_cases ?? []
  const questLang = q.language ?? 'javascript'

  const { count: passedCount } = await supabase.from('quest_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('quest_id', quest_id).in('status', ['passed_clean', 'passed_dirty'])
  const isFirstPass = (passedCount ?? 0) === 0

  const htmlTags = ['<!doctype','<html','<h1','<h2','<h3','<h4','<h5','<h6','<p','<div','<ul','<ol','<table','<form','<header','<nav','<main','<section','<article','<footer','<a ','<img','<span','<input','<button','<label','<style','<script']
  const isHTMLQuest = htmlTags.some(tag => expectedOutput.trim().toLowerCase().startsWith(tag))
  // CSS quest: expected output adalah CSS rules, BUKAN JSON/JS
  // JSON dimulai dengan [ atau { diikuti " — bukan CSS
  const looksLikeJSON = /^[\[{]/.test(expectedOutput.trim())
  const cssFirstToken = expectedOutput.trim().split(/[\s({]/)[0].toLowerCase()
  const isCSSQuest = !looksLikeJSON
    && /^[a-zA-Z0-9*#.()\.\[\]\s,_:>+~-]+\s*\{/.test(expectedOutput.trim())
    && !['function','const','let','var','return','if','else','for','while','console','import','export','class','new','this','async','await'].includes(cssFirstToken)

  let actualOutputs: string[] = []
  let hadSyntaxError = false

  if (isHTMLQuest || isCSSQuest) {
    actualOutputs = [submitted_code]
  } else if (questLang === 'python') {
    const r = await executePython(submitted_code, testCases)
    actualOutputs = r.outputs; hadSyntaxError = r.hadSyntaxError
  } else {
    const r = executeJS(submitted_code, testCases)
    actualOutputs = r.outputs; hadSyntaxError = r.hadSyntaxError
  }

  let attemptStatus: 'syntax_error' | 'logic_error' | 'passed_dirty' | 'passed_clean'
  let allPassed = false

  if (hadSyntaxError) {
    attemptStatus = 'syntax_error'
  } else {
    if (isCSSQuest) {
      const nc = (s: string) => s.trim().replace(/\r\n|\n|\r/g, ' ').replace(/\s+/g, ' ').replace(/\s*{\s*/g, ' { ').replace(/\s*}\s*/g, ' } ').replace(/\s*:\s*/g, ': ').replace(/\s*;\s*/g, '; ').trim()
      const es = (s: string) => { const m = s.match(/<style[^>]*>([\s\S]*?)<\/style>/i); return m ? m[1].trim() : s }
      const sub = nc(es(actualOutputs[0] ?? '')), exp = nc(expectedOutput)
      allPassed = sub === exp || sub.includes(exp)
    } else if (isHTMLQuest) {
      const sub = actualOutputs[0] ?? ''
      const expN = normalizeHTML(expectedOutput)
      allPassed = normalizeHTML(extractBody(sub)) === expN || normalizeHTML(sub) === expN
        || normalizeHTML(sub).includes(expN) || normalizeHTML(extractBody(sub)).includes(expN)
    } else if (testCases.length > 0) {
      allPassed = testCases.every((tc, i) => {
        const a = normalize(actualOutputs[i] ?? '')
        const e = normalize(tc.expected_output?.trim() ? tc.expected_output : expectedOutput)
        return normCompare(a, e) || normCompare(a, normalize(expectedOutput))
      })
    } else {
      allPassed = normCompare(normalize(actualOutputs[0] ?? ''), normalize(expectedOutput))
    }
    const cs = calcCleanCodeScore(submitted_code)
    attemptStatus = allPassed ? (cs >= 80 ? 'passed_clean' : 'passed_dirty') : 'logic_error'
  }

  const cleanCodeScore = calcCleanCodeScore(submitted_code)
  const socraticText = buildFeedback(attemptStatus, actualOutputs[0] ?? '', expectedOutput, questLang)
  const passed = attemptStatus === 'passed_clean' || attemptStatus === 'passed_dirty'
  const baseReward = q.exp_reward ?? 100
  let expEarned = 0
  if (passed) {
    if (isFirstPass) expEarned = hints_used_count === 0 ? baseReward * 2 : baseReward
    if (cleanCodeScore >= 80) expEarned += 25
  }

  const { data: attempt, error: insertError } = await supabase.from('quest_attempts').insert({
    user_id: user.id, quest_id, submitted_code, status: attemptStatus,
    correctness_score: passed ? 100 : 0, efficiency_score: cleanCodeScore,
    speed_score: Math.max(0, 100 - Math.floor((duration_sec ?? 0) / 60) * 5),
    final_score: passed ? Math.round((100 + cleanCodeScore) / 2) : 0,
    exp_earned: expEarned, hints_used_count, is_first_pass: isFirstPass && passed,
    execution_output: actualOutputs[0] ?? '', socratic_feedback: socraticText,
    attempt_duration_sec: duration_sec ?? 0,
  }).select('id').single()

  if (insertError) { console.error('insert attempt:', insertError); return serverError('Gagal menyimpan attempt.') }

  let newLevel = 1, oldLevel = 1, newTotalExp = 0, currentStreak = 0, longestStreak = 0, leveledUp = false
  if (passed) {
    const { data: stats } = await admin.from('user_stats').select('total_exp,current_level,weekly_exp,quests_completed,clean_code_avg,hints_used_total,current_streak,longest_streak').eq('user_id', user.id).single()
    const s = (stats as Record<string, number> | null) ?? { total_exp:0,current_level:1,weekly_exp:0,quests_completed:0,clean_code_avg:0,hints_used_total:0,current_streak:0,longest_streak:0 }
    oldLevel = s.current_level ?? 1; newTotalExp = (s.total_exp ?? 0) + expEarned
    newLevel = Math.floor(1 + Math.sqrt(newTotalExp / 500)); leveledUp = newLevel > oldLevel
    const nc2 = isFirstPass ? (s.quests_completed ?? 0) + 1 : (s.quests_completed ?? 0)
    const newAvg = (((s.clean_code_avg ?? 0) * (Math.max(nc2,1) - 1)) + cleanCodeScore) / Math.max(nc2, 1)
    const streak = await updateStreak(admin, user.id, expEarned)
    currentStreak = streak.currentStreak; longestStreak = streak.longestStreak
    const { error: se } = await admin.from('user_stats').upsert({ user_id: user.id, total_exp: newTotalExp, current_level: newLevel, weekly_exp: (s.weekly_exp ?? 0) + expEarned, quests_completed: nc2, clean_code_avg: Math.round(newAvg * 100) / 100, hints_used_total: (s.hints_used_total ?? 0) + hints_used_count, last_active_date: new Date().toISOString().split('T')[0], current_streak: currentStreak, longest_streak: longestStreak }, { onConflict: 'user_id' })
    if (se) console.error('user_stats error:', se)
  }

  return ok({ attempt_id: (attempt as { id: string } | null)?.id, status: attemptStatus, execution_output: actualOutputs[0] ?? '', socratic_feedback: socraticText, clean_code_score: cleanCodeScore, exp_earned: expEarned, new_total_exp: newTotalExp, new_level: newLevel, old_level: oldLevel, leveled_up: leveledUp, current_streak: currentStreak, is_first_pass: isFirstPass && passed })
}