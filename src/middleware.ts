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

        // Public routes - always allow without auth
        const publicPaths = [
          '/',
          '/login',
          '/register',
          '/forgot-password',
          '/verify-email',
          '/pricing',
          '/features',
          '/onboarding',
        ]

        // Check if it's an exact public path or starts with it
        for (const path of publicPaths) {
          if (pathname === path || (path !== '/' && pathname.startsWith(path + '/'))) {
            return true
          }
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
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, images, etc.
     * - Root path / (landing page - handle in page.tsx)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
