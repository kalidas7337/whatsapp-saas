import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { onboardingService } from '@/lib/onboarding/onboarding.service'

// GET /api/onboarding - Get onboarding data
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await onboardingService.getOnboardingData(
      session.user.organizationId
    )

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to get onboarding data:', error)
    return NextResponse.json(
      { error: 'Failed to get onboarding data' },
      { status: 500 }
    )
  }
}

// PUT /api/onboarding - Update onboarding data
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const data = await onboardingService.saveOnboardingData(
      session.user.organizationId,
      body
    )

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to update onboarding data:', error)
    return NextResponse.json(
      { error: 'Failed to update onboarding data' },
      { status: 500 }
    )
  }
}
