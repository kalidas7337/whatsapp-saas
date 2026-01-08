'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (status === 'unauthenticated') {
    return null
  }

  return <OnboardingWizard />
}
