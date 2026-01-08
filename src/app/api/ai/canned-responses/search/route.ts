/**
 * Canned Responses Search API
 *
 * GET /api/ai/canned-responses/search?q=prefix - Search by shortcut prefix
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const prefix = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (!prefix) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Search for shortcuts starting with prefix
    const responses = await prisma.whatsapp_canned_responses?.findMany({
      where: {
        organization_id: user.organizationId,
        is_active: true,
        shortcut: {
          startsWith: prefix,
          mode: 'insensitive',
        },
      },
      orderBy: [
        { usage_count: 'desc' },
        { shortcut: 'asc' },
      ],
      take: Math.min(limit, 20),
    }).catch(() => [])

    return NextResponse.json({
      success: true,
      data: responses || [],
    })
  } catch (error) {
    console.error('Search canned responses error:', error)
    return NextResponse.json(
      { error: 'Failed to search responses', message: (error as Error).message },
      { status: 500 }
    )
  }
}
