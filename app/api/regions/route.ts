import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ok, serverError } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/auth'
export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { user } = await getAuthUser()

  const { data: regions, error } = await supabase
    .from('regions')
    .select('id, slug, name, description, learning_path, accent_color, order_index, exp_reward, badge_id')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) return serverError('Gagal mengambil data region.')

  if (!user || !regions) return ok(regions ?? [])
  const { data: attempts } = await supabase
    .from('quest_attempts')
    .select('quest_id, status')
    .eq('user_id', user.id)
    .in('status', ['passed_clean', 'passed_dirty'])

  const completedQuestIds = new Set((attempts ?? []).map(a => a.quest_id))

  const { data: quests } = await supabase
    .from('quests')
    .select('id, region_id')
    .eq('is_active', true)

  const regionProgress = regions.map(region => {
    const regionQuests   = (quests ?? []).filter(q => q.region_id === region.id)
    const totalQuests    = regionQuests.length
    const completedCount = regionQuests.filter(q => completedQuestIds.has(q.id)).length
    return {
      ...region,
      total_quests:     totalQuests,
      completed_quests: completedCount,
      completion_pct:   totalQuests > 0 ? Math.round((completedCount / totalQuests) * 100) : 0,
    }
  })

  return ok(regionProgress)
}