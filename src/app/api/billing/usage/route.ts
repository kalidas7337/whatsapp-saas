import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BillingService } from '@/lib/billing'

export async function GET() {
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
    const usage = await service.getCurrentUsage()

    return NextResponse.json(usage)
  } catch (error) {
    console.error('Error getting usage:', error)
    return NextResponse.json(
      { error: 'Failed to get usage' },
      { status: 500 }
    )
  }
}
