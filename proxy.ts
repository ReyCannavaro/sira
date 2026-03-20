import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_ROUTES = ['/adventure', '/community', '/workshop', '/leaderboard', '/profile/me']
const ADMIN_ROUTES     = ['/admin']
const PUBLIC_ROUTES    = ['/', '/login', '/register', '/api/auth']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js)$/)
  ) return NextResponse.next()

  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return NextResponse.next()

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

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect_to', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!user) return response

  if (pathname.startsWith('/onboarding')) return response
  if (isProtected) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('hero_class')
      .eq('id', user.id)
      .single()

    if (!profile?.hero_class) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // 3. Admin Guard
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  if (isAdminRoute) {
    const { data: { session } } = await supabase.auth.getSession()
    const isAdmin = session?.user?.app_metadata?.role === 'admin'
    if (!isAdmin) return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname.startsWith('/leaderboard')) {
    const { data: stats } = await supabase
      .from('user_stats')
      .select('current_level')
      .eq('user_id', user.id)
      .single()

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