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
  /*
   * Only run middleware on protected routes.
   * Exclude: landing page, auth pages, marketing pages, static files
   */
  matcher: [
    '/inbox/:path*',
    '/contacts/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/api/ai/:path*',
    '/api/analytics/:path*',
    '/api/billing/:path*',
    '/api/onboarding/:path*',
    '/api/settings/:path*',
  ],
}
