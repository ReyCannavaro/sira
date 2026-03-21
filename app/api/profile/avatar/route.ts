import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/auth'

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const formData = await request.formData()
  const file     = formData.get('file') as File | null

  if (!file) return badRequest('File tidak ditemukan')
  if (!file.type.startsWith('image/')) return badRequest('Hanya file gambar yang diizinkan')
  if (file.size > 2 * 1024 * 1024) return badRequest('Ukuran file maksimal 2MB')

  const supabase = await createSupabaseServerClient()
  const ext      = file.name.split('.').pop() ?? 'jpg'
  const path     = `avatars/${user!.id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    console.error('upload avatar error:', uploadError)
    return serverError('Gagal upload avatar.')
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  await supabase.from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user!.id)

  return ok({ avatar_url: publicUrl }, 'Avatar berhasil diupdate')
}

export async function DELETE() {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const supabase = await createSupabaseServerClient()

  await supabase.storage.from('avatars').remove([
    `avatars/${user!.id}.jpg`,
    `avatars/${user!.id}.jpeg`,
    `avatars/${user!.id}.png`,
    `avatars/${user!.id}.webp`,
  ])

  await supabase.from('profiles')
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq('id', user!.id)

  return ok(null, 'Avatar dihapus')
}