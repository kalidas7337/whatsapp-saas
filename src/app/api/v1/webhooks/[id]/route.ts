/**
 * Single Webhook API Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/v1/webhooks/:id - Get a single webhook
 * PATCH /api/v1/webhooks/:id - Update a webhook
 * DELETE /api/v1/webhooks/:id - Delete a webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  validateAPIKey,
  requireScope,
  checkRateLimit,
  addRateLimitHeaders,
  logAPIRequest,
  successResponse,
  errorResponse,
  createWebhookService,
} from '@/lib/api'
import type { WebhookEvent } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params

  // Validate API key
  const authResult = await validateAPIKey(request)
  if (!authResult.context) {
    return NextResponse.json(
      authResult.error || errorResponse('UNAUTHORIZED', 'Invalid API key'),
      { status: 401 }
    )
  }

  const context = authResult.context

  // Check rate limit
  const rateLimit = checkRateLimit(context.apiKeyId)
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      errorResponse('RATE_LIMITED', 'Rate limit exceeded'),
      { status: 429 }
    )
    return addRateLimitHeaders(response, rateLimit.info)
  }

  // Check scope
  const scopeError = requireScope('webhooks:read')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    const service = createWebhookService(context.organizationId, context.apiKeyId)
    const webhook = await service.getWebhook(id)

    if (!webhook) {
      await logAPIRequest(context, request, 404, Date.now() - startTime)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Webhook not found'),
        { status: 404 }
      )
    }

    // Get stats and recent deliveries
    const [stats, deliveries] = await Promise.all([
      service.getWebhookStats(id),
      service.getDeliveryLogs(id, 10),
    ])

    const response = NextResponse.json(
      successResponse({
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
        stats: {
          totalDeliveries: stats.totalDeliveries,
          successfulDeliveries: stats.successfulDeliveries,
          failedDeliveries: stats.failedDeliveries,
          successRate: stats.successRate,
          last24Hours: stats.last24Hours,
        },
        recentDeliveries: deliveries.map((d) => ({
          id: d.id,
          event: d.event,
          status: d.status,
          statusCode: d.statusCode,
          attempts: d.attempts,
          createdAt: d.createdAt,
          deliveredAt: d.deliveredAt,
        })),
      })
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Webhook API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to fetch webhook'),
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params

  // Validate API key
  const authResult = await validateAPIKey(request)
  if (!authResult.context) {
    return NextResponse.json(
      authResult.error || errorResponse('UNAUTHORIZED', 'Invalid API key'),
      { status: 401 }
    )
  }

  const context = authResult.context

  // Check rate limit
  const rateLimit = checkRateLimit(context.apiKeyId)
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      errorResponse('RATE_LIMITED', 'Rate limit exceeded'),
      { status: 429 }
    )
    return addRateLimitHeaders(response, rateLimit.info)
  }

  // Check scope
  const scopeError = requireScope('webhooks:write')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    const service = createWebhookService(context.organizationId, context.apiKeyId)
    const existing = await service.getWebhook(id)

    if (!existing) {
      await logAPIRequest(context, request, 404, Date.now() - startTime)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Webhook not found'),
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate URL if provided
    if (body.url) {
      try {
        new URL(body.url)
      } catch {
        return NextResponse.json(
          errorResponse('VALIDATION_ERROR', 'Invalid URL format'),
          { status: 400 }
        )
      }
    }

    // Validate events if provided
    if (body.events) {
      const validEvents: WebhookEvent[] = [
        'message.received',
        'message.sent',
        'message.delivered',
        'message.read',
        'message.failed',
        'conversation.created',
        'conversation.assigned',
        'conversation.resolved',
        'conversation.reopened',
        'contact.created',
        'contact.updated',
        'contact.opted_out',
        'campaign.started',
        'campaign.completed',
        'campaign.failed',
      ]

      const invalidEvents = body.events.filter((e: string) => !validEvents.includes(e as WebhookEvent))
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          errorResponse(
            'VALIDATION_ERROR',
            `Invalid events: ${invalidEvents.join(', ')}`,
            { validEvents }
          ),
          { status: 400 }
        )
      }
    }

    const webhook = await service.updateWebhook(id, {
      url: body.url,
      events: body.events,
      description: body.description,
      headers: body.headers,
      isActive: body.isActive,
    })

    const response = NextResponse.json(
      successResponse({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        description: webhook.description,
        headers: webhook.headers,
        updatedAt: webhook.updatedAt,
      })
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Webhook API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to update webhook'),
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params

  // Validate API key
  const authResult = await validateAPIKey(request)
  if (!authResult.context) {
    return NextResponse.json(
      authResult.error || errorResponse('UNAUTHORIZED', 'Invalid API key'),
      { status: 401 }
    )
  }

  const context = authResult.context

  // Check rate limit
  const rateLimit = checkRateLimit(context.apiKeyId)
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      errorResponse('RATE_LIMITED', 'Rate limit exceeded'),
      { status: 429 }
    )
    return addRateLimitHeaders(response, rateLimit.info)
  }

  // Check scope
  const scopeError = requireScope('webhooks:write')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    const service = createWebhookService(context.organizationId, context.apiKeyId)
    const existing = await service.getWebhook(id)

    if (!existing) {
      await logAPIRequest(context, request, 404, Date.now() - startTime)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Webhook not found'),
        { status: 404 }
      )
    }

    await service.deleteWebhook(id)

    const response = NextResponse.json(
      successResponse({ deleted: true, id }),
      { status: 200 }
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Webhook API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to delete webhook'),
      { status: 500 }
    )
  }
}
