import { NextRequest, NextResponse } from 'next/server'

const ADMIN_COOKIE_NAME = 'meier_admin_session'

function getAdminConfig() {
  const username = process.env.ADMIN_USERNAME?.trim()
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim()
  const sessionSecret = process.env.ADMIN_SESSION_SECRET?.trim()

  if (!username || !passwordHash || !sessionSecret) {
    return null
  }

  return { username, passwordHash, sessionSecret }
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function isValidAdminSession(request: NextRequest) {
  const config = getAdminConfig()
  if (!config) {
    return false
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  if (!token) {
    return false
  }

  const expected = await sha256Hex(`${config.username}:${config.passwordHash}:${config.sessionSecret}`)
  return token === expected
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const isLoginRoute = pathname === '/admin/login'
  const hasValidSession = await isValidAdminSession(request)

  if (!hasValidSession) {
    if (isLoginRoute) {
      return NextResponse.next()
    }

    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isLoginRoute) {
    const adminUrl = new URL('/admin', request.url)
    return NextResponse.redirect(adminUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
