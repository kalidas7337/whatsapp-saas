/**
 * Canned Responses Usage API
 *
 * POST /api/ai/canned-responses/usage - Record usage of a response
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const RecordUsageSchema = z.object({
  responseId: z.string().uuid(),
  success: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validation = RecordUsageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { responseId, success } = validation.data

    // Get current response
    const existing = await prisma.whatsapp_canned_responses?.findFirst({
      where: {
        id: responseId,
        organization_id: user.organizationId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      )
    }

    // Calculate new success rate
    const newUsageCount = (existing.usage_count || 0) + 1
    const currentSuccessCount = Math.round(
      (existing.success_rate || 0) * (existing.usage_count || 0)
    )
    const newSuccessCount = currentSuccessCount + (success ? 1 : 0)
    const newSuccessRate = newUsageCount > 0 ? newSuccessCount / newUsageCount : 0

    // Update response
    const response = await prisma.whatsapp_canned_responses?.update({
      where: { id: responseId },
      data: {
        usage_count: newUsageCount,
        success_rate: newSuccessRate,
        last_used_at: new Date(),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        usageCount: response?.usage_count,
        successRate: response?.success_rate,
      },
    })
  } catch (error) {
    console.error('Record usage error:', error)
    return NextResponse.json(
      { error: 'Failed to record usage', message: (error as Error).message },
      { status: 500 }
    )
  }
}
