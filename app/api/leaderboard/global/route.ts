import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ok, serverError } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/auth'

interface ProfileJoin {
  username:     string | null
  display_name: string | null
  avatar_url:   string | null
  hero_class:   string | null
}

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
    const myExpRes = await supabase
      .from('user_stats')
      .select('total_exp')
      .eq('user_id', user!.id)
      .single()

    const myExp = myExpRes.data?.total_exp ?? 0
    const { count } = await supabase
      .from('user_stats')
      .select('user_id', { count: 'exact', head: true })
      .gt('total_exp', myExp)

    myRank = (count ?? 0) + 1
  }

  const ranked = (data ?? []).map((d, i) => {
    const profile = (Array.isArray(d.profiles) ? d.profiles[0] : d.profiles) as ProfileJoin | null
    return {
      rank:             from + i + 1,
      user_id:          d.user_id,
      total_exp:        d.total_exp,
      current_level:    d.current_level,
      weekly_exp:       d.weekly_exp,
      quests_completed: d.quests_completed,
      username:         profile?.username     ?? '',
      display_name:     profile?.display_name ?? '',
      avatar_url:       profile?.avatar_url   ?? null,
      hero_class:       profile?.hero_class   ?? null,
      is_me:            d.user_id === user!.id,
    }
  })

  return ok({ entries: ranked, my_rank: myRank, page, limit })
}