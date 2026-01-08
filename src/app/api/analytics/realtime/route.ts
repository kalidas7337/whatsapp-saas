/**
 * Real-time Analytics API
 * PROMPT 31: Advanced Analytics & Reporting
 *
 * GET /api/analytics/realtime - Get real-time metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAnalyticsService } from '@/lib/analytics'

export async function GET(_request: NextRequest) {
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

    const analyticsService = createAnalyticsService(user.organizationId)
    const metrics = await analyticsService.getRealTimeMetrics()

    return NextResponse.json({
      success: true,
      data: metrics,
    })
  } catch (error) {
    console.error('Realtime analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get realtime metrics', message: (error as Error).message },
      { status: 500 }
    )
  }
}
