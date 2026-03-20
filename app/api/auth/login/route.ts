import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { badRequest, ok, unauthorized, serverError } from '@/lib/api/response'
import { parseBody } from '@/lib/api/auth'

interface LoginBody {
  email:    string
  password: string
}

export async function POST(request: NextRequest) {
  const { body, error: parseError } = await parseBody<LoginBody>(request)
  if (parseError || !body) return badRequest(parseError ?? 'Body tidak valid')

  if (!body.email || !body.password) return badRequest('Email dan password wajib diisi')

  const supabase = await createSupabaseServerClient()

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email:    body.email.toLowerCase().trim(),
    password: body.password,
  })

  if (signInError) {
    if (
      signInError.message.includes('Invalid login credentials') ||
      signInError.message.includes('invalid_credentials')
    ) return unauthorized('Email atau password salah')

    if (signInError.message.includes('Email not confirmed'))
      return unauthorized('Email belum diverifikasi. Cek inbox kamu.')

    console.error('signIn error:', signInError)
    return serverError('Gagal login. Coba lagi.')
  }

  if (!data.user || !data.session) return serverError('Gagal membuat session. Coba lagi.')

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, username, display_name, avatar_url, hero_class, is_public,
      user_stats ( current_level, total_exp, weekly_exp, current_streak )
    `)
    .eq('id', data.user.id)
    .single()

  await supabase
    .from('user_stats')
    .update({ last_active_date: new Date().toISOString().split('T')[0] })
    .eq('user_id', data.user.id)

  return ok({
    user: { id: data.user.id, email: data.user.email, ...profile },
    session: {
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at:    data.session.expires_at,
    },
  }, 'Login berhasil')
}