import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BillingService } from '@/lib/billing'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { organizationId?: string }
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    const service = new BillingService(user.organizationId)
    await service.cancelSubscription(true) // Cancel at period end

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    const message = error instanceof Error ? error.message : 'Failed to cancel subscription'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
