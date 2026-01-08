/**
 * Team Performance Analytics API
 * PROMPT 31: Advanced Analytics & Reporting
 *
 * GET /api/analytics/team - Get team performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAnalyticsService } from '@/lib/analytics'

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    // Parse dates
    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Get team performance
    const analyticsService = createAnalyticsService(user.organizationId)
    const teamPerformance = await analyticsService.getTeamPerformance({
      start: startDate,
      end: endDate,
    })

    return NextResponse.json({
      success: true,
      data: teamPerformance,
    })
  } catch (error) {
    console.error('Team analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get team performance', message: (error as Error).message },
      { status: 500 }
    )
  }
}
