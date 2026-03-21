import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ok, badRequest, serverError } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/auth'

export async function GET() {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('workshop_projects')
    .select('id, title, description, is_public, created_at, updated_at')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })

  if (error) return serverError('Gagal mengambil project.')
  return ok(data ?? [])
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  let body: { title: string; description?: string; html: string; css: string; js: string; is_public?: boolean }
  try { body = await request.json() }
  catch { return badRequest('Body tidak valid') }

  if (!body.title?.trim()) return badRequest('Judul project wajib diisi')
  if (body.title.length > 80) return badRequest('Judul maksimal 80 karakter')

  const supabase = await createSupabaseServerClient()

  const { count } = await supabase
    .from('workshop_projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  if ((count ?? 0) >= 20) return badRequest('Maksimal 20 project per akun')

  const { data, error } = await supabase
    .from('workshop_projects')
    .insert({
      user_id:     user!.id,
      title:       body.title.trim(),
      description: body.description?.trim() || null,
      html_code:   body.html,
      css_code:    body.css,
      js_code:     body.js,
      is_public:   body.is_public ?? false,
    })
    .select('id, title, created_at')
    .single()

  if (error) return serverError('Gagal menyimpan project.')
  return ok(data, 'Project berhasil disimpan')
}