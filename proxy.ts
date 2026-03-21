import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_ROUTES = ['/adventure', '/community', '/workshop', '/leaderboard', '/profile']
const ADMIN_ROUTES     = ['/admin']
const PUBLIC_ROUTES    = ['/login', '/register', '/api/auth', '/api/regions']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Static assets ─────────────────────────────────────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff2?)$/)
  ) return NextResponse.next()

  // ── Setup Supabase client ─────────────────────────────────────────────────
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── 1. Public routes ──────────────────────────────────────────────────────
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    // Reverse guard: sudah login + buka /login → redirect
    if (user && pathname.startsWith('/login')) {
      const { data: profile } = await supabase
        .from('profiles').select('hero_class').eq('id', user.id).single()
      return NextResponse.redirect(
        new URL(profile?.hero_class ? '/adventure' : '/onboarding', request.url)
      )
    }
    return response
  }

  // ── 2. Root / ─────────────────────────────────────────────────────────────
  if (pathname === '/') {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const { data: profile } = await supabase
      .from('profiles').select('hero_class').eq('id', user.id).single()
    return NextResponse.redirect(
      new URL(profile?.hero_class ? '/adventure' : '/onboarding', request.url)
    )
  }

  // ── 3. Protected routes: harus login ─────────────────────────────────────
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect_to', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── 4. Onboarding — biarkan lewat ────────────────────────────────────────
  if (pathname.startsWith('/onboarding')) return response

  // ── 5. Protected: cek hero_class sudah dipilih ────────────────────────────
  if (isProtected && user) {
    const { data: profile } = await supabase
      .from('profiles').select('hero_class').eq('id', user.id).single()
    if (!profile?.hero_class) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // ── 6. Admin guard ────────────────────────────────────────────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    const isAdmin = user?.app_metadata?.role === 'admin'
    if (!isAdmin) return NextResponse.redirect(new URL('/adventure', request.url))
  }

  // ── 7. Level gate: /leaderboard butuh Level 10 ────────────────────────────
  if (pathname.startsWith('/leaderboard') && user) {
    const { data: stats } = await supabase
      .from('user_stats').select('current_level').eq('user_id', user.id).single()
    if (!stats || stats.current_level < 10) {
      const url = new URL('/adventure', request.url)
      url.searchParams.set('notice', 'leaderboard_locked')
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}