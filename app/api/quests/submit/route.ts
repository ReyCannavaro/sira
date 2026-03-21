import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api/response'

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

function buildFeedback(status: string, actual: string, expected: string, clean: number, lang: string): string {
  if (status === 'syntax_error') {
    return lang === 'python'
      ? 'Ada kesalahan sintaks. Di Python, indentasi sangat penting — pastikan setiap blok kode diindentasi dengan benar.'
      : 'Ada bagian kode yang tidak bisa dibaca mesin. Periksa apakah semua kurung kurawal {} dan tanda kurung () sudah berpasangan.'
  }
  if (status === 'logic_error') {
    const t = actual?.trim()
    if (!t) return 'Kode berjalan tapi tidak menghasilkan output. Pastikan kamu sudah mencetak hasilnya — apakah ada console.log() yang terlewat?'
    return `Output kamu adalah "${t}", tapi seharusnya "${expected.trim()}". Coba trace kodemu baris per baris — di mana nilainya mulai berbeda?`
  }
  if (status === 'passed_dirty') return 'Quest selesai! Tapi ada ruang untuk kode yang lebih bersih. Perhatikan penamaan variabel dan kedalaman nesting.'
  if (status === 'passed_clean') return 'Luar biasa! Kode kamu bersih, logikanya tepat, dan outputnya benar. Wilayah berikutnya menantimu.'
  return ''
}

async function updateStreak(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  expEarned: number
) {
  const today = new Date().toISOString().split('T')[0]

  await adminClient.from('streaks').upsert({
    user_id:       userId,
    activity_date: today,
    quests_done:   1,
    exp_earned:    expEarned,
  }, { onConflict: 'user_id,activity_date', ignoreDuplicates: false })

  const { data: recentStreaks } = await adminClient
    .from('streaks')
    .select('activity_date')
    .eq('user_id', userId)
    .gte('activity_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
    .order('activity_date', { ascending: false })

  const dates = new Set((recentStreaks ?? []).map((s: { activity_date: string }) => s.activity_date))

  let currentStreak = 0
  let cursor = new Date()
  while (true) {
    const d = cursor.toISOString().split('T')[0]
    if (!dates.has(d)) break
    currentStreak++
    cursor = new Date(cursor.getTime() - 86400000)
  }

  const { data: statsRow } = await adminClient
    .from('user_stats')
    .select('longest_streak')
    .eq('user_id', userId)
    .single()

  const longestStreak = Math.max((statsRow as { longest_streak?: number } | null)?.longest_streak ?? 0, currentStreak)
  return { currentStreak, longestStreak }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const admin = createSupabaseAdminClient()

  let body: {
    quest_id: string; submitted_code: string
    hints_used_count: number; duration_sec: number
    language: string; expected_output: string
    actual_output: string; had_syntax_error: boolean
    test_cases: { input: string; expected_output: string }[]
  }
  try { body = await request.json() }
  catch { return badRequest('Body tidak valid') }

  const {
    quest_id, submitted_code, hints_used_count, duration_sec,
    language, expected_output, actual_output, had_syntax_error, test_cases,
  } = body

  if (!quest_id || submitted_code === undefined) return badRequest('quest_id dan submitted_code wajib diisi')

  const { count: passedCount } = await supabase
    .from('quest_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('quest_id', quest_id)
    .in('status', ['passed_clean', 'passed_dirty'])
  const isFirstPass = (passedCount ?? 0) === 0

  const normalize     = (s: string) => (s ?? '').trim().replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '')
  const normalizeHTML = (s: string) => (s ?? '').trim().replace(/\r\n|\n|\r/g, '').replace(/\s{2,}/g, ' ').replace(/> </g, '><').replace(/ >/g, '>').toLowerCase()
  const extractBody   = (s: string) => {
    const lower = s.toLowerCase()
    const start = lower.indexOf('<body')
    const end   = lower.lastIndexOf('</body>')
    if (start !== -1 && end !== -1) { const e = s.indexOf('>', start); return s.slice(e + 1, end).trim() }
    return s
  }

  const htmlTags    = ['<!doctype','<html','<h1','<h2','<h3','<h4','<h5','<h6','<p','<div','<ul','<ol','<table','<form','<header','<nav','<main','<section','<article','<footer']
  const isHTMLQuest = htmlTags.some(tag => (expected_output?.trim().toLowerCase() ?? '').startsWith(tag))

  let attemptStatus: 'syntax_error' | 'logic_error' | 'passed_dirty' | 'passed_clean'

  if (had_syntax_error) {
    attemptStatus = 'syntax_error'
  } else {
    const outputStr = actual_output ?? ''
    let allPassed   = false

    if (isHTMLQuest) {
      const submittedBody = normalizeHTML(extractBody(outputStr))
      const expectedNorm  = normalizeHTML(expected_output)
      const submittedFull = normalizeHTML(outputStr)
      allPassed = submittedBody === expectedNorm || submittedFull === expectedNorm
    } else if (test_cases?.length > 0) {
      allPassed = test_cases.every(tc => normalize(outputStr) === normalize(tc.expected_output))
    } else {
      allPassed = normalize(outputStr) === normalize(expected_output)
    }

    if (allPassed) {
      const cs  = calcCleanCodeScore(submitted_code)
      attemptStatus = cs >= 80 ? 'passed_clean' : 'passed_dirty'
    } else {
      attemptStatus = 'logic_error'
    }
  }

  const cleanCodeScore = calcCleanCodeScore(submitted_code)
  const socraticText   = buildFeedback(attemptStatus, actual_output ?? '', expected_output, cleanCodeScore, language)
  const passed         = attemptStatus === 'passed_clean' || attemptStatus === 'passed_dirty'

  const { data: questRow } = await supabase.from('quests').select('exp_reward').eq('id', quest_id).single()
  const baseReward = (questRow as { exp_reward?: number } | null)?.exp_reward ?? 100

  let expEarned = 0
  if (passed) {
    if (isFirstPass) expEarned = hints_used_count === 0 ? baseReward * 2 : baseReward
    if (cleanCodeScore >= 80) expEarned += 25
  }

  const { data: attempt, error: insertError } = await supabase
    .from('quest_attempts')
    .insert({
      user_id:              user.id, quest_id, submitted_code,
      status:               attemptStatus,
      correctness_score:    passed ? 100 : 0,
      efficiency_score:     cleanCodeScore,
      speed_score:          Math.max(0, 100 - Math.floor((duration_sec ?? 0) / 60) * 5),
      final_score:          passed ? Math.round((100 + cleanCodeScore) / 2) : 0,
      exp_earned:           expEarned,
      hints_used_count:     hints_used_count ?? 0,
      is_first_pass:        isFirstPass && passed,
      execution_output:     actual_output ?? '',
      socratic_feedback:    socraticText,
      attempt_duration_sec: duration_sec ?? 0,
    })
    .select('id')
    .single()

  if (insertError) { console.error('insert attempt:', insertError); return serverError('Gagal menyimpan attempt.') }

  let newLevel      = 1
  let oldLevel      = 1
  let newTotalExp   = 0
  let currentStreak = 0
  let longestStreak = 0
  let leveledUp     = false

  if (passed) {
    const { data: stats } = await admin
      .from('user_stats')
      .select('total_exp, current_level, weekly_exp, quests_completed, clean_code_avg, hints_used_total, current_streak, longest_streak')
      .eq('user_id', user.id)
      .single()

    const s = (stats as Record<string, number> | null) ?? {
      total_exp: 0, current_level: 1, weekly_exp: 0,
      quests_completed: 0, clean_code_avg: 0,
      hints_used_total: 0, current_streak: 0, longest_streak: 0,
    }

    oldLevel     = s.current_level ?? 1
    newTotalExp  = (s.total_exp ?? 0) + expEarned
    newLevel     = Math.floor(1 + Math.sqrt(newTotalExp / 500))
    leveledUp    = newLevel > oldLevel

    const newCompleted = isFirstPass ? (s.quests_completed ?? 0) + 1 : (s.quests_completed ?? 0)
    const n            = Math.max(newCompleted, 1)
    const newAvg       = (((s.clean_code_avg ?? 0) * (n - 1)) + cleanCodeScore) / n

    const streakResult = await updateStreak(admin, user.id, expEarned)
    currentStreak = streakResult.currentStreak
    longestStreak = streakResult.longestStreak

    const { error: statsError } = await admin.from('user_stats').upsert({
      user_id:          user.id,
      total_exp:        newTotalExp,
      current_level:    newLevel,
      weekly_exp:       (s.weekly_exp ?? 0) + expEarned,
      quests_completed: newCompleted,
      clean_code_avg:   Math.round(newAvg * 100) / 100,
      hints_used_total: (s.hints_used_total ?? 0) + (hints_used_count ?? 0),
      last_active_date: new Date().toISOString().split('T')[0],
      current_streak:   currentStreak,
      longest_streak:   longestStreak,
    }, { onConflict: 'user_id' })

    if (statsError) console.error('user_stats upsert error:', statsError)
  }

  return ok({
    attempt_id:        (attempt as { id: string } | null)?.id,
    status:            attemptStatus,
    execution_output:  actual_output ?? '',
    socratic_feedback: socraticText,
    clean_code_score:  cleanCodeScore,
    exp_earned:        expEarned,
    new_total_exp:     newTotalExp,
    new_level:         newLevel,
    old_level:         oldLevel,
    leveled_up:        leveledUp,
    current_streak:    currentStreak,
    is_first_pass:     isFirstPass && passed,
  })
}