/**
 * Webhooks Management Route (Internal)
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/settings/webhooks - List webhooks
 * POST /api/settings/webhooks - Create a webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createWebhookService, WEBHOOK_EVENTS } from '@/lib/api'
import type { WebhookEvent } from '@/lib/api'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = createWebhookService(
      session.user.organizationId,
      session.user.id
    )
    const webhooks = await service.listWebhooks()

    return NextResponse.json({
      success: true,
      data: webhooks.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        isActive: w.isActive,
        description: w.description,
        failureCount: w.failureCount,
        lastTriggeredAt: w.lastTriggeredAt,
        lastSuccessAt: w.lastSuccessAt,
        lastFailureAt: w.lastFailureAt,
        createdAt: w.createdAt,
      })),
      eventTypes: Object.entries(WEBHOOK_EVENTS).map(([key, value]) => ({
        event: key,
        ...value,
      })),
    })
  } catch (error) {
    console.error('Webhooks list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.url) {
      return NextResponse.json(
        { error: 'Missing required field: url' },
        { status: 400 }
      )
    }

    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty events array' },
        { status: 400 }
      )
    }

    // Validate URL
    try {
      new URL(body.url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Validate events
    const validEvents = Object.keys(WEBHOOK_EVENTS) as WebhookEvent[]
    const invalidEvents = body.events.filter((e: string) => !validEvents.includes(e as WebhookEvent))
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(', ')}` },
        { status: 400 }
      )
    }

    const service = createWebhookService(
      session.user.organizationId,
      session.user.id
    )
    const webhook = await service.createWebhook({
      url: body.url,
      events: body.events,
      description: body.description,
      headers: body.headers,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret, // Only returned on creation
        events: webhook.events,
        isActive: webhook.isActive,
        description: webhook.description,
        createdAt: webhook.createdAt,
      },
    })
  } catch (error) {
    console.error('Webhook creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}
