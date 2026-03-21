import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { badRequest, ok, forbidden, serverError } from '@/lib/api/response'
import { getAuthUser, parseBody } from '@/lib/api/auth'
import { calculateLevel } from '@/lib/utils/level'
import type { CommunityType, CreateCommunityRequest } from '@/types'
export async function GET() {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('community_members')
    .select(`
      role, joined_at, weekly_exp_contribution,
      community:communities (
        id, name, description, type, invite_code, is_public,
        focus_topic, member_count, weekly_exp_total, squad_war_rank, created_at, owner_id
      )
    `)
    .eq('user_id', user!.id)
    .order('joined_at', { ascending: false })

  if (error) return serverError('Gagal mengambil data komunitas.')

  return ok(data ?? [])
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const { body, error: parseError } = await parseBody<CreateCommunityRequest>(request)
  if (parseError || !body) return badRequest(parseError ?? 'Body tidak valid')

  if (!body.name?.trim())    return badRequest('Nama komunitas wajib diisi')
  if (body.name.length > 60) return badRequest('Nama komunitas maksimal 60 karakter')
  if (!['squad', 'school'].includes(body.type)) return badRequest('Tipe komunitas tidak valid')

  const supabase = await createSupabaseServerClient()

  const { data: stats } = await supabase
    .from('user_stats')
    .select('total_exp, current_level')
    .eq('user_id', user!.id)
    .single()

  const userLevel = stats?.current_level ?? calculateLevel(stats?.total_exp ?? 0)
  const minLevel  = body.type === 'school' ? 25 : 15

  if (userLevel < minLevel) {
    return forbidden(`Kamu perlu Level ${minLevel} untuk membuat komunitas ${body.type === 'school' ? 'Sekolah' : 'Squad'}. Level kamu saat ini: ${userLevel}.`)
  }

  const { count } = await supabase
    .from('communities')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user!.id)

  if ((count ?? 0) >= 10) {
    return badRequest('Kamu sudah memiliki 10 komunitas. Hapus salah satu untuk membuat yang baru.')
  }

  const { data: community, error: createError } = await supabase
    .from('communities')
    .insert({
      owner_id:    user!.id,
      name:        body.name.trim(),
      description: body.description?.trim() ?? null,
      type:        body.type as CommunityType,
      is_public:   body.is_public ?? (body.type === 'squad'),
      focus_topic: body.focus_topic?.trim() ?? null,
    })
    .select()
    .single()

  if (createError || !community) return serverError('Gagal membuat komunitas.')

  await supabase.from('community_members').insert({
    community_id: community.id,
    user_id:      user!.id,
    role:         'leader',
  })

  await supabase.from('communities').update({ member_count: 1 }).eq('id', community.id)

  return ok(community, 'Komunitas berhasil dibuat!')
}