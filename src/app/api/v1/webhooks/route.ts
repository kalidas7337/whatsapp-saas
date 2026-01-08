/**
 * Webhooks API Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/v1/webhooks - List webhooks
 * POST /api/v1/webhooks - Create a webhook
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
  paginatedResponse,
  createWebhookService,
} from '@/lib/api'
import type { WebhookEvent } from '@/lib/api'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

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
    const webhooks = await service.listWebhooks()

    // Parse pagination from query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    // Simple pagination
    const start = (page - 1) * limit
    const paginatedWebhooks = webhooks.slice(start, start + limit)

    const response = NextResponse.json(
      paginatedResponse(
        paginatedWebhooks.map((w) => ({
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
          updatedAt: w.updatedAt,
        })),
        page,
        limit,
        webhooks.length
      )
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Webhooks API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to fetch webhooks'),
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

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
    const body = await request.json()

    // Validate required fields
    if (!body.url) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Missing required field: url'),
        { status: 400 }
      )
    }

    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Missing or empty events array'),
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(body.url)
    } catch {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid URL format'),
        { status: 400 }
      )
    }

    // Validate events
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

    const service = createWebhookService(context.organizationId, context.apiKeyId)
    const webhook = await service.createWebhook({
      url: body.url,
      events: body.events,
      description: body.description,
      headers: body.headers,
    })

    const response = NextResponse.json(
      successResponse({
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret, // Only returned on creation
        events: webhook.events,
        isActive: webhook.isActive,
        description: webhook.description,
        createdAt: webhook.createdAt,
      }),
      { status: 201 }
    )

    await logAPIRequest(context, request, 201, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Webhooks API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to create webhook'),
      { status: 500 }
    )
  }
}
