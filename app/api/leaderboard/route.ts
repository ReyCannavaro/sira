import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ok, serverError } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/auth'

export async function GET(request: Request) {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') ?? '50')))
  const from  = (page - 1) * limit
  const to    = from + limit - 1

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('user_stats')
    .select(`
      user_id, total_exp, current_level, weekly_exp, quests_completed,
      profiles ( username, display_name, avatar_url, hero_class )
    `)
    .order('total_exp', { ascending: false })
    .range(from, to)

  if (error) return serverError('Gagal mengambil leaderboard.')

  let myRank: number | null = null
  const meInList = data?.find(d => d.user_id === user!.id)
  if (!meInList) {
    const { count } = await supabase
      .from('user_stats')
      .select('user_id', { count: 'exact', head: true })
      .gt('total_exp', (await supabase.from('user_stats').select('total_exp').eq('user_id', user!.id).single()).data?.total_exp ?? 0)
    myRank = (count ?? 0) + 1
  }

  const ranked = (data ?? []).map((d, i) => ({
    rank:         from + i + 1,
    user_id:      d.user_id,
    total_exp:    d.total_exp,
    current_level:d.current_level,
    weekly_exp:   d.weekly_exp,
    quests_completed: d.quests_completed,
    username:     (d.profiles as Record<string, unknown>)?.username,
    display_name: (d.profiles as Record<string, unknown>)?.display_name,
    avatar_url:   (d.profiles as Record<string, unknown>)?.avatar_url,
    hero_class:   (d.profiles as Record<string, unknown>)?.hero_class,
    is_me:        d.user_id === user!.id,
  }))

  return ok({ entries: ranked, my_rank: myRank, page, limit })
}