/**
 * Single Webhook Management Route (Internal)
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/settings/webhooks/:id - Get webhook details
 * PATCH /api/settings/webhooks/:id - Update webhook
 * DELETE /api/settings/webhooks/:id - Delete webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createWebhookService, WEBHOOK_EVENTS } from '@/lib/api'
import type { WebhookEvent } from '@/lib/api'

export async function GET(
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

    // Get stats and deliveries
    const [stats, deliveries] = await Promise.all([
      service.getWebhookStats(id),
      service.getDeliveryLogs(id, 50),
    ])

    return NextResponse.json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        description: webhook.description,
        headers: webhook.headers,
        failureCount: webhook.failureCount,
        lastTriggeredAt: webhook.lastTriggeredAt,
        lastSuccessAt: webhook.lastSuccessAt,
        lastFailureAt: webhook.lastFailureAt,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
        stats,
        deliveries,
      },
    })
  } catch (error) {
    console.error('Webhook fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate URL if provided
    if (body.url) {
      try {
        new URL(body.url)
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        )
      }
    }

    // Validate events if provided
    if (body.events) {
      const validEvents = Object.keys(WEBHOOK_EVENTS) as WebhookEvent[]
      const invalidEvents = body.events.filter((e: string) => !validEvents.includes(e as WebhookEvent))
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid events: ${invalidEvents.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const service = createWebhookService(
      session.user.organizationId,
      session.user.id
    )

    const existing = await service.getWebhook(id)
    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const webhook = await service.updateWebhook(id, {
      url: body.url,
      events: body.events,
      description: body.description,
      headers: body.headers,
      isActive: body.isActive,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        description: webhook.description,
        headers: webhook.headers,
        updatedAt: webhook.updatedAt,
      },
    })
  } catch (error) {
    console.error('Webhook update error:', error)
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const existing = await service.getWebhook(id)
    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    await service.deleteWebhook(id)

    return NextResponse.json({
      success: true,
      data: { deleted: true, id },
    })
  } catch (error) {
    console.error('Webhook delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}
