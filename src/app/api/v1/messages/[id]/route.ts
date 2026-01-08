/**
 * Single Message API Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/v1/messages/:id - Get a single message
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  validateAPIKey,
  requireScope,
  checkRateLimit,
  addRateLimitHeaders,
  logAPIRequest,
  successResponse,
  errorResponse,
} from '@/lib/api'

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
  const scopeError = requireScope('messages:read')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    // Find message and verify organization access through conversation
    const message = await prisma.whatsapp_messages.findFirst({
      where: {
        id,
        conversation: {
          organization_id: context.organizationId,
        },
      },
      include: {
        contact: {
          select: {
            id: true,
            phone_number: true,
            name: true,
          },
        },
      },
    })

    if (!message) {
      await logAPIRequest(context, request, 404, Date.now() - startTime)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Message not found'),
        { status: 404 }
      )
    }

    const response = NextResponse.json(
      successResponse({
        id: message.id,
        waMessageId: message.wamid,
        conversationId: message.conversation_id,
        contact: message.contact
          ? {
              id: message.contact.id,
              phoneNumber: message.contact.phone_number,
              name: message.contact.name,
            }
          : null,
        direction: message.direction,
        messageType: message.message_type,
        content: message.content,
        mediaUrl: message.media_url,
        mediaMimeType: message.media_mime_type,
        templateName: message.template_name,
        status: message.status,
        errorCode: message.error_code,
        errorMessage: message.error_message,
        createdAt: message.created_at,
        sentAt: message.sent_at,
        deliveredAt: message.delivered_at,
        readAt: message.read_at,
      })
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Message API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to fetch message'),
      { status: 500 }
    )
  }
}
