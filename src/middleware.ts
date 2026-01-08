import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Redirect to onboarding if no organization (only for authenticated users)
    if (
      token &&
      !token.organizationId &&
      !pathname.startsWith('/onboarding') &&
      !pathname.startsWith('/api')
    ) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes - always allow
        const publicPaths = [
          '/',
          '/login',
          '/register',
          '/forgot-password',
          '/verify-email',
          '/pricing',
          '/features',
        ]

        // Check if it's a public path
        if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
          return true
        }

        // API routes that are public
        if (
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/webhooks') ||
          pathname.startsWith('/api/whatsapp') ||
          pathname.startsWith('/api/v1') ||
          pathname.startsWith('/api/health')
        ) {
          return true
        }

        // Protected routes require auth
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
