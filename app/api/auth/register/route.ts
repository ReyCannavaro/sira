import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { badRequest, created, serverError } from '@/lib/api/response'
import { parseBody } from '@/lib/api/auth'

interface RegisterBody {
  email:        string
  password:     string
  username:     string
  display_name: string
}

function validate(body: RegisterBody): string | null {
  if (!body.email?.trim()) return 'Email wajib diisi'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return 'Format email tidak valid'
  if (!body.password || body.password.length < 8) return 'Password minimal 8 karakter'
  if (!body.username?.trim()) return 'Username wajib diisi'
  if (!/^[a-z0-9_]{3,30}$/.test(body.username))
    return 'Username hanya boleh huruf kecil, angka, dan underscore (3-30 karakter)'
  if (!body.display_name?.trim()) return 'Nama tampilan wajib diisi'
  return null
}

export async function POST(request: NextRequest) {
  const { body, error: parseError } = await parseBody<RegisterBody>(request)
  if (parseError || !body) return badRequest(parseError ?? 'Body tidak valid')

  const validationError = validate(body)
  if (validationError) return badRequest(validationError)

  const supabase = await createSupabaseServerClient()

  const { data: existing } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', body.username.toLowerCase())
    .single()

  if (existing) return badRequest('Username sudah digunakan. Pilih username lain.')

  const { data, error: signUpError } = await supabase.auth.signUp({
    email:    body.email.toLowerCase(),
    password: body.password,
    options: {
      data: {
        username:     body.username.toLowerCase(),
        display_name: body.display_name.trim(),
        full_name:    body.display_name.trim(),
      },
    },
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      return badRequest('Email sudah terdaftar. Coba login.')
    }
    console.error('signUp error:', signUpError)
    return serverError('Gagal mendaftar. Coba lagi.')
  }

  if (!data.user) return serverError('Gagal membuat akun. Coba lagi.')

  await supabase
    .from('profiles')
    .update({ username: body.username.toLowerCase(), display_name: body.display_name.trim() })
    .eq('id', data.user.id)

  return created(
    {
      user:    { id: data.user.id, email: data.user.email },
      session: data.session,
    },
    data.session
      ? 'Akun berhasil dibuat. Selamat datang di SIRA!'
      : 'Akun berhasil dibuat. Cek email untuk verifikasi.'
  )
}