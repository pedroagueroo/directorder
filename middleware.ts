import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // Proteger rutas /admin y /staff
  if (path.startsWith('/admin') || path.startsWith('/staff')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    // Verificar rol
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (path.startsWith('/admin') && user?.role === 'employee') {
      return NextResponse.redirect(new URL('/staff', req.url))
    }
  }
  return res
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*']
}
