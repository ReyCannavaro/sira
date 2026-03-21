import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { ok, unauthorized } from '@/lib/api/response'
import { BADGES, BadgeCheckStats } from '@/lib/badges'

export async function POST(_request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const admin = createSupabaseAdminClient()

  const [statsRes, attemptsRes, badgesRes] = await Promise.all([
    admin.from('user_stats')
      .select('quests_completed, current_streak, longest_streak, current_level')
      .eq('user_id', user.id)
      .single(),

    admin.from('quest_attempts')
      .select('status, quest:quests(region:regions(learning_path))')
      .eq('user_id', user.id)
      .in('status', ['passed_clean', 'passed_dirty'])
      .order('created_at', { ascending: false }),

    admin.from('user_badges')
      .select('badge_id, badges!inner(slug)')
      .eq('user_id', user.id),
  ])

  const stats    = statsRes.data as Record<string, number> | null
  type AttemptRow = {
    status: string
    quest: { region: { learning_path: string } | null } | null
  }
  type UserBadgeRow = { badge_id: string; badges: { slug: string } | { slug: string }[] | null }
  const attempts: AttemptRow[] = ((attemptsRes.data ?? []) as unknown) as AttemptRow[]
  const earned = new Set(
    (badgesRes.data ?? []).map((row: unknown) => {
      const r = (row as UserBadgeRow).badges
      if (!r) return ''
      return Array.isArray(r) ? (r[0]?.slug ?? '') : (r.slug ?? '')
    }).filter(Boolean)
  )

  let cleanStreak = 0
  for (const a of attempts) {
    if (a.status === 'passed_clean') cleanStreak++
    else break
  }

  const coastal   = attempts.filter(a => a.quest?.region?.learning_path === 'web_dev').length
  const highlands = attempts.filter(a => a.quest?.region?.learning_path === 'machine_learning').length
  const citadel   = attempts.filter(a => a.quest?.region?.learning_path === 'computer_science').length

  const checkStats: BadgeCheckStats = {
    quests_completed:    stats?.quests_completed ?? 0,
    current_streak:      stats?.current_streak ?? 0,
    longest_streak:      stats?.longest_streak ?? 0,
    clean_code_streak:   cleanStreak,
    current_level:       stats?.current_level ?? 1,
    coastal_completed:   coastal,
    highlands_completed: highlands,
    citadel_completed:   citadel,
  }

  const newBadges: string[] = []
  for (const badge of BADGES) {
    if (earned.has(badge.slug)) continue
    if (badge.check(checkStats)) newBadges.push(badge.slug)
  }

  if (newBadges.length === 0) return ok({ awarded: [] })

  const { data: badgeRows } = await admin
    .from('badges')
    .select('id, slug')
    .in('slug', newBadges)

  if (!badgeRows?.length) return ok({ awarded: [] })

  const inserts = (badgeRows as { id: string; slug: string }[]).map(b => ({
    user_id:     user.id,
    badge_id:    b.id,
    is_featured: false,
  }))

  const { error } = await admin.from('user_badges').insert(inserts)
  if (error) console.error('award badge error:', error)

  return ok({ awarded: (badgeRows as { id: string; slug: string }[]).map(b => b.slug) })
}