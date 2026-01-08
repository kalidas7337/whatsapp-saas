/**
 * Analytics Dashboard API
 * PROMPT 31: Advanced Analytics & Reporting
 *
 * GET /api/analytics/dashboard - Get executive dashboard data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAnalyticsService, getDateRangeFromPreset } from '@/lib/analytics'
import { DateRangePreset, ComparisonPeriod } from '@/lib/analytics/types'

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
    const preset = searchParams.get('preset') as DateRangePreset | null
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const comparisonEnabled = searchParams.get('comparisonEnabled') === 'true'
    const comparisonType = searchParams.get('comparisonType') as
      | 'previousPeriod'
      | 'previousYear'
      | null

    // Calculate date range
    let dateRange
    if (startDateStr && endDateStr) {
      dateRange = {
        start: new Date(startDateStr),
        end: new Date(endDateStr),
        preset: 'custom' as const,
      }
    } else if (preset) {
      dateRange = getDateRangeFromPreset(preset)
    } else {
      dateRange = getDateRangeFromPreset('last7days')
    }

    // Validate dates
    if (isNaN(dateRange.start.getTime()) || isNaN(dateRange.end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Build comparison config
    const comparison: ComparisonPeriod = {
      enabled: comparisonEnabled,
      type: comparisonType || 'previousPeriod',
    }

    // Get analytics
    const analyticsService = createAnalyticsService(user.organizationId)
    const dashboard = await analyticsService.getExecutiveDashboard(
      dateRange,
      comparison
    )

    return NextResponse.json({
      success: true,
      data: dashboard,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard', message: (error as Error).message },
      { status: 500 }
    )
  }
}
