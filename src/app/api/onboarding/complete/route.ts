import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { onboardingService } from '@/lib/onboarding/onboarding.service'

// POST /api/onboarding/complete - Complete onboarding
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await onboardingService.completeOnboarding(session.user.organizationId)

    return NextResponse.json({
      success: true,
      redirectUrl: '/inbox',
    })
  } catch (error) {
    console.error('Failed to complete onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
