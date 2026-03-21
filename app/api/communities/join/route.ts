import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { badRequest, ok, serverError } from '@/lib/api/response'
import { getAuthUser, parseBody } from '@/lib/api/auth'

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const { body, error: parseError } = await parseBody<{ invite_code: string }>(request)
  if (parseError || !body) return badRequest(parseError ?? 'Body tidak valid')
  if (!body.invite_code?.trim()) return badRequest('Kode undangan wajib diisi')

  const supabase = await createSupabaseServerClient()
  const { data: community, error: findError } = await supabase
    .from('communities')
    .select('id, name, type, member_count')
    .eq('invite_code', body.invite_code.trim().toUpperCase())
    .single()

  if (findError || !community) return badRequest('Kode undangan tidak valid atau sudah kadaluarsa.')
  const { data: existing } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', community.id)
    .eq('user_id', user!.id)
    .single()

  if (existing) return badRequest('Kamu sudah menjadi anggota komunitas ini.')
  const { error: joinError } = await supabase
    .from('community_members')
    .insert({ community_id: community.id, user_id: user!.id, role: 'member' })

  if (joinError) return serverError('Gagal bergabung ke komunitas.')
  await supabase
    .from('communities')
    .update({ member_count: (community.member_count ?? 0) + 1 })
    .eq('id', community.id)

  return ok({ community_id: community.id, name: community.name }, `Berhasil bergabung ke ${community.name}!`)
}