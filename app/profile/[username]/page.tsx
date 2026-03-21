import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

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

  /* ── Auth check ── */
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const isOwner = authUser?.id === profile.id
  if (!profile.is_public && !isOwner) notFound()

  /* ── Fetch semua data secara parallel ── */
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

  return (
    <ProfileClient
      profile={profile}
      stats={statsRes.data ?? null}
      userBadges={(badgesRes.data ?? []) as any}
      streaks={streaksRes.data ?? []}
      memberships={(membershipsRes.data ?? []) as any}
      recentAttempts={(attemptsRes.data ?? []) as any}
      isOwner={isOwner}
    />
  )
}