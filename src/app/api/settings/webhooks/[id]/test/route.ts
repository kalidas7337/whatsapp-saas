/**
 * Webhook Test Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * POST /api/settings/webhooks/:id/test - Test webhook delivery
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createWebhookService } from '@/lib/api'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = createWebhookService(
      session.user.organizationId,
      session.user.id
    )

    const webhook = await service.getWebhook(id)
    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const result = await service.testWebhook(id)

    return NextResponse.json({
      success: result.success,
      data: {
        success: result.success,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        error: result.error,
      },
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    )
  }
}
