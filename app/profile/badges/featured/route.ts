import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api/response'
import { getAuthUser, parseBody } from '@/lib/api/auth'

export async function PATCH(request: NextRequest) {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const { body, error: parseError } = await parseBody<{
    user_badge_id: string
    is_featured:   boolean
  }>(request)
  if (parseError || !body) return badRequest('Body tidak valid')

  const supabase = await createSupabaseServerClient()

  const { data: badge } = await supabase
    .from('user_badges')
    .select('id, is_featured')
    .eq('id', body.user_badge_id)
    .eq('user_id', user!.id)
    .single()

  if (!badge) return badRequest('Badge tidak ditemukan')

  if (body.is_featured) {
    const { count } = await supabase
      .from('user_badges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('is_featured', true)

    if ((count ?? 0) >= 3) return badRequest('Maksimal 3 badge unggulan')
  }

  const { error } = await supabase
    .from('user_badges')
    .update({ is_featured: body.is_featured })
    .eq('id', body.user_badge_id)
    .eq('user_id', user!.id)

  if (error) return serverError('Gagal update badge')

  return ok({ is_featured: body.is_featured }, 'Badge diperbarui')
}