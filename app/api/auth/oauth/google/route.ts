import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { serverError } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  const redirectTo = searchParams.get('redirect_to') ?? '/adventure'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?redirect_to=${redirectTo}`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })

  if (error || !data.url) {
    console.error('OAuth error:', error)
    return serverError('Gagal memulai login dengan Google.')
  }

  return NextResponse.redirect(data.url)
}