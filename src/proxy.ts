import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith('/login')
  const isApiRoute = pathname.startsWith('/api')
  if (isApiRoute) return NextResponse.next()

  // Detect session by checking for any Supabase auth cookie
  // This is a fast local check — no network call to Supabase
  const hasSession = request.cookies.getAll().some(c => c.name.includes('auth-token'))

  if (!hasSession && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (hasSession && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|logo-bem.png).*)'],
}
