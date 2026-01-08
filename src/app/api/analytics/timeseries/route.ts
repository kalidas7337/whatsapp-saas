/**
 * Time Series Analytics API
 * PROMPT 31: Advanced Analytics & Reporting
 *
 * GET /api/analytics/timeseries - Get time series data for a metric
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAnalyticsService } from '@/lib/analytics'
import { MetricType, GroupByType } from '@/lib/analytics/types'

const VALID_METRICS: MetricType[] = [
  'messages_sent',
  'messages_received',
  'messages_delivered',
  'messages_read',
  'messages_failed',
  'conversations_started',
  'conversations_resolved',
]

const VALID_GROUP_BY: GroupByType[] = ['hour', 'day', 'week', 'month', 'quarter', 'year']

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
    const metric = searchParams.get('metric') as MetricType | null
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const groupBy = (searchParams.get('groupBy') as GroupByType) || 'day'

    // Validate metric
    if (!metric || !VALID_METRICS.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric. Valid values: ${VALID_METRICS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate groupBy
    if (!VALID_GROUP_BY.includes(groupBy)) {
      return NextResponse.json(
        { error: `Invalid groupBy. Valid values: ${VALID_GROUP_BY.join(', ')}` },
        { status: 400 }
      )
    }

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

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Get time series data
    const analyticsService = createAnalyticsService(user.organizationId)
    const timeSeries = await analyticsService.getTimeSeries(
      metric,
      { start: startDate, end: endDate },
      groupBy
    )

    return NextResponse.json({
      success: true,
      data: timeSeries,
    })
  } catch (error) {
    console.error('Timeseries analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get timeseries', message: (error as Error).message },
      { status: 500 }
    )
  }
}
