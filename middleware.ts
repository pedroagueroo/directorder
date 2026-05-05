import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const role = req.cookies.get('auth-role')?.value
  const activeBranch = req.cookies.get('auth-active-branch-id')?.value || req.cookies.get('auth-restaurant-id')?.value
  const path = req.nextUrl.pathname

  if (path.startsWith('/select-branch')) {
    if (!role) return NextResponse.redirect(new URL('/login', req.url))
    return NextResponse.next({ request: req })
  }

  if (path.startsWith('/admin') || path.startsWith('/staff')) {
    if (!role) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (!activeBranch) {
      return NextResponse.redirect(new URL('/select-branch', req.url))
    }

    if (path.startsWith('/admin') && role !== 'owner') {
      return NextResponse.redirect(new URL('/staff', req.url))
    }
  }
  
  return NextResponse.next({ request: req })
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/select-branch']
}
