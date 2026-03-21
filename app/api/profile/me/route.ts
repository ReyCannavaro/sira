import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { badRequest, ok, unauthorized, serverError } from '@/lib/api/response'
import { getAuthUser, parseBody } from '@/lib/api/auth'

export async function GET() {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const supabase = await createSupabaseServerClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id, username, display_name, avatar_url, hero_class, bio, is_public, created_at,
      user_stats (
        total_exp, current_level, weekly_exp, quests_completed,
        str_score, int_score, agi_score,
        current_streak, longest_streak, last_active_date,
        hints_used_total, clean_code_avg
      )
    `)
    .eq('id', user!.id)
    .single()

  if (error || !profile) return serverError('Gagal mengambil profil.')

  const { data: badges } = await supabase
    .from('user_badges')
    .select('id, earned_at, is_featured, badge:badges(id, slug, name, description, category, rarity, icon_url)')
    .eq('user_id', user!.id)
    .order('earned_at', { ascending: false })

  return ok({ ...profile, badges: badges ?? [] })
}

export async function PATCH(request: NextRequest) {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const { body, error: parseError } = await parseBody<{
    display_name?: string
    bio?:          string
    avatar_url?:   string
    is_public?:    boolean
  }>(request)
  if (parseError || !body) return badRequest(parseError ?? 'Body tidak valid')

  const allowed: Record<string, unknown> = {}
  if (body.display_name !== undefined) {
    if (!body.display_name.trim()) return badRequest('Display name tidak boleh kosong')
    allowed.display_name = body.display_name.trim()
  }
  if (body.bio !== undefined) {
    if (body.bio.length > 280) return badRequest('Bio maksimal 280 karakter')
    allowed.bio = body.bio.trim() || null
  }
  if (body.avatar_url  !== undefined) allowed.avatar_url  = body.avatar_url
  if (body.is_public   !== undefined) allowed.is_public   = body.is_public
  allowed.updated_at = new Date().toISOString()

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('profiles').update(allowed).eq('id', user!.id)
  if (error) return serverError('Gagal update profil.')

  return ok(null, 'Profil berhasil diperbarui')
}