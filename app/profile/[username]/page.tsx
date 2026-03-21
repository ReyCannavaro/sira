import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

type Badge         = { id: string; slug: string; name: string; description: string; category: string; rarity: string; icon_url: string | null }
type UserBadge     = { id: string; earned_at: string; is_featured: boolean; badge: Badge }
type Membership    = { role: string; community: { id: string; name: string; type: string; weekly_exp_total: number; squad_war_rank: number | null } }
type RecentAttempt = { id: string; exp_earned: number; status: string; created_at: string; quest: { title: string; difficulty: string } }

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} — SIRA`,
    description: `Profil ${username} di SIRA Academy`,
    robots: 'noindex',
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase     = await createSupabaseServerClient()

  /* ── Profil ── */
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, hero_class, bio, is_public, created_at')
    .eq('username', username.toLowerCase())
    .single()

  if (!profile) notFound()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  const isOwner = authUser?.id === profile.id
  if (!profile.is_public && !isOwner) notFound()

  const [statsRes, badgesRes, streaksRes, membershipsRes, attemptsRes] = await Promise.all([
    supabase
      .from('user_stats')
      .select('total_exp, current_level, weekly_exp, quests_completed, current_streak, longest_streak, hints_used_total, clean_code_avg')
      .eq('user_id', profile.id)
      .single(),

    supabase
      .from('user_badges')
      .select('id, earned_at, is_featured, badge:badges(id, slug, name, description, category, rarity, icon_url)')
      .eq('user_id', profile.id)
      .order('earned_at', { ascending: false }),

    supabase
      .from('streaks')
      .select('activity_date, quests_done, exp_earned')
      .eq('user_id', profile.id)
      .gte('activity_date', new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0])
      .order('activity_date', { ascending: true }),

    supabase
      .from('community_members')
      .select('role, community:communities(id, name, type, weekly_exp_total, squad_war_rank)')
      .eq('user_id', profile.id),

    supabase
      .from('quest_attempts')
      .select('id, exp_earned, status, created_at, quest:quests(title, difficulty)')
      .eq('user_id', profile.id)
      .in('status', ['passed_clean', 'passed_dirty'])
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const rawBadges = (badgesRes.data ?? []) as unknown as Array<{
    id: string; earned_at: string; is_featured: boolean;
    badge: Badge | Badge[] | null;
  }>
  const userBadges: UserBadge[] = rawBadges
    .map(b => ({ ...b, badge: Array.isArray(b.badge) ? b.badge[0] : b.badge }))
    .filter(b => b.badge != null) as UserBadge[]

  return (
    <ProfileClient
      profile={profile}
      stats={statsRes.data ?? null}
      userBadges={userBadges}
      streaks={streaksRes.data ?? []}
      memberships={(membershipsRes.data ?? []) as unknown as Membership[]}
      recentAttempts={(attemptsRes.data ?? []) as unknown as RecentAttempt[]}
      isOwner={isOwner}
    />
  )
}