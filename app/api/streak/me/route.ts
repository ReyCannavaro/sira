import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ok, serverError } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/auth'

export async function GET() {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const supabase = await createSupabaseServerClient()

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: streaks, error } = await supabase
    .from('streaks')
    .select('activity_date, quests_done, exp_earned')
    .eq('user_id', user!.id)
    .gte('activity_date', oneYearAgo.toISOString().split('T')[0])
    .order('activity_date', { ascending: true })

  if (error) return serverError('Gagal mengambil data streak.')

  const { data: stats } = await supabase
    .from('user_stats')
    .select('current_streak, longest_streak, last_active_date')
    .eq('user_id', user!.id)
    .single()

  return ok({
    heatmap:        streaks ?? [],
    current_streak: stats?.current_streak  ?? 0,
    longest_streak: stats?.longest_streak  ?? 0,
    last_active:    stats?.last_active_date ?? null,
  })
}