import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BillingService, PlanId } from '@/lib/billing'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as {
      organizationId?: string
      email?: string
      name?: string
      phone?: string
    }
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { planId, annual } = body as { planId: PlanId; annual?: boolean }

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Enterprise plans require contact sales
    if (planId === 'enterprise') {
      return NextResponse.json(
        { error: 'Please contact sales for Enterprise plan' },
        { status: 400 }
      )
    }

    const service = new BillingService(user.organizationId)
    const { subscriptionId, shortUrl } = await service.createSubscription(
      planId,
      annual || false,
      user.email || '',
      user.name || user.email || '',
      user.phone || ''
    )

    return NextResponse.json({ subscriptionId, shortUrl })
  } catch (error) {
    console.error('Error creating checkout:', error)
    const message = error instanceof Error ? error.message : 'Failed to create subscription'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
