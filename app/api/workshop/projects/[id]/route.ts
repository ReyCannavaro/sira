import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('workshop_projects')
    .select('id, title, description, html_code, css_code, js_code, is_public, user_id, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !data) return notFound('Project tidak ditemukan.')
  if (!data.is_public && data.user_id !== user!.id) return notFound('Project tidak ditemukan.')

  return ok(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  let body: { title?: string; description?: string; html?: string; css?: string; js?: string; is_public?: boolean }
  try { body = await request.json() }
  catch { return badRequest('Body tidak valid') }

  const supabase = await createSupabaseServerClient()

  const { data: existing } = await supabase
    .from('workshop_projects')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing) return notFound('Project tidak ditemukan.')
  if (existing.user_id !== user!.id) return notFound('Project tidak ditemukan.')

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title       !== undefined) updates.title       = body.title.trim()
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.html        !== undefined) updates.html_code   = body.html
  if (body.css         !== undefined) updates.css_code    = body.css
  if (body.js          !== undefined) updates.js_code     = body.js
  if (body.is_public   !== undefined) updates.is_public   = body.is_public

  const { error } = await supabase
    .from('workshop_projects')
    .update(updates)
    .eq('id', id)

  if (error) return serverError('Gagal update project.')
  return ok(null, 'Project berhasil diperbarui')
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const supabase = await createSupabaseServerClient()

  const { data: existing } = await supabase
    .from('workshop_projects')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== user!.id) return notFound('Project tidak ditemukan.')

  const { error } = await supabase
    .from('workshop_projects')
    .delete()
    .eq('id', id)

  if (error) return serverError('Gagal hapus project.')
  return ok(null, 'Project dihapus')
}