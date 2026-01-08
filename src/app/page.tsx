import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LandingPage } from '@/components/landing/landing-page'

export default async function HomePage() {
  try {
    const session = await getServerSession(authOptions)

    // If user is logged in, redirect to dashboard
    if (session) {
      redirect('/inbox')
    }
  } catch {
    // If auth check fails (e.g., missing env vars), just show landing page
    console.warn('Auth check failed, showing landing page')
  }

  // Show marketing landing page for non-authenticated users
  return <LandingPage />
}
