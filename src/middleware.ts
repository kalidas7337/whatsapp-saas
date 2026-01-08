import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Redirect to onboarding if no organization
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

        // Public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/forgot-password') ||
          pathname.startsWith('/verify-email') ||
          pathname.startsWith('/pricing') ||
          pathname.startsWith('/features') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/webhooks') ||
          pathname.startsWith('/api/whatsapp') || // WhatsApp internal API
          pathname.startsWith('/api/v1') // Public API
        ) {
          return true
        }

        // Protected routes require auth
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.png$).*)',
  ],
}
