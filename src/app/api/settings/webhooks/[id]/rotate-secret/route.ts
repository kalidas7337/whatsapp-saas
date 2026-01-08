/**
 * Webhook Secret Rotation Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * POST /api/settings/webhooks/:id/rotate-secret - Rotate webhook secret
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

    const newSecret = await service.rotateSecret(id)

    return NextResponse.json({
      success: true,
      data: {
        secret: newSecret,
        message: 'Webhook secret rotated successfully. Update your integration with the new secret.',
      },
    })
  } catch (error) {
    console.error('Webhook secret rotation error:', error)
    return NextResponse.json(
      { error: 'Failed to rotate webhook secret' },
      { status: 500 }
    )
  }
}
