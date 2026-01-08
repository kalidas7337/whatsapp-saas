/**
 * AI Analytics API
 *
 * GET /api/ai/analytics - Get AI classification analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIService } from '@/lib/ai'

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
    const period = searchParams.get('period') || '7d'

    // Calculate date range
    let startDate: Date
    let endDate: Date = new Date()

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr)
      endDate = new Date(endDateStr)
    } else {
      // Use period to calculate start date
      switch (period) {
        case '24h':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }

    // Validate dates
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

    // Get AI service and analytics
    const aiService = getAIService(user.organizationId)
    const analytics = await aiService.getAnalytics(startDate, endDate)

    // Add cache stats
    const cacheStats = aiService.getCacheStats()

    return NextResponse.json({
      success: true,
      data: {
        ...analytics,
        cache: cacheStats,
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get analytics', message: (error as Error).message },
      { status: 500 }
    )
  }
}
