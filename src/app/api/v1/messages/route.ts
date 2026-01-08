/**
 * Messages API Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/v1/messages - List messages
 * POST /api/v1/messages - Send a message
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
  paginatedResponse,
} from '@/lib/api'
import { dispatchMessageSent } from '@/lib/api'

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
  const scopeError = requireScope('messages:read')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const conversationId = searchParams.get('conversation_id')
    const contactId = searchParams.get('contact_id')
    const direction = searchParams.get('direction') as 'INBOUND' | 'OUTBOUND' | null
    const status = searchParams.get('status')

    // Build query
    const where: Record<string, unknown> = {
      organization_id: context.organizationId,
    }

    if (conversationId) where.conversation_id = conversationId
    if (contactId) where.contact_id = contactId
    if (direction) where.direction = direction
    if (status) where.status = status

    // Get total count
    const total = await prisma.whatsapp_messages.count({ where })

    // Get messages
    const messages = await prisma.whatsapp_messages.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        wamid: true,
        conversation_id: true,
        contact_id: true,
        direction: true,
        message_type: true,
        content: true,
        media_url: true,
        status: true,
        error_code: true,
        error_message: true,
        created_at: true,
        sent_at: true,
        delivered_at: true,
        read_at: true,
      },
    })

    const response = NextResponse.json(
      paginatedResponse(
        messages.map((m) => ({
          id: m.id,
          waMessageId: m.wamid,
          conversationId: m.conversation_id,
          contactId: m.contact_id,
          direction: m.direction,
          messageType: m.message_type,
          content: m.content,
          mediaUrl: m.media_url,
          status: m.status,
          errorCode: m.error_code,
          errorMessage: m.error_message,
          createdAt: m.created_at,
          sentAt: m.sent_at,
          deliveredAt: m.delivered_at,
          readAt: m.read_at,
        })),
        page,
        limit,
        total
      )
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Messages API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to fetch messages'),
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
  const scopeError = requireScope('messages:write')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.conversationId) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Missing required field: conversationId'),
        { status: 400 }
      )
    }

    if (!body.type) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Missing required field: type'),
        { status: 400 }
      )
    }

    // Find conversation
    const conversation = await prisma.whatsapp_conversations.findFirst({
      where: {
        id: body.conversationId,
        organization_id: context.organizationId,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Conversation not found'),
        { status: 404 }
      )
    }

    // Create message
    const message = await prisma.whatsapp_messages.create({
      data: {
        conversation_id: conversation.id,
        contact_id: conversation.contact_id,
        direction: 'OUTGOING',
        type: body.type,
        message_type: body.type,
        content: body.content || body.text || null,
        media_url: body.mediaUrl || null,
        template_name: body.templateName || null,
        template_language: body.templateLanguage || null,
        status: 'PENDING',
      },
    })

    // Update conversation
    await prisma.whatsapp_conversations.update({
      where: { id: conversation.id },
      data: {
        last_message_at: new Date(),
        last_message_preview: body.content || body.text || `[${body.type}]`,
        message_count: { increment: 1 },
      },
    })

    // Dispatch webhook
    await dispatchMessageSent(context.organizationId, {
      id: message.id,
      conversationId: conversation.id,
      contactId: conversation.contact_id,
      type: body.type,
      content: body.content || body.text,
      status: 'PENDING',
      createdAt: message.created_at,
    })

    const response = NextResponse.json(
      successResponse({
        id: message.id,
        conversationId: conversation.id,
        contactId: conversation.contact_id,
        type: body.type,
        status: 'PENDING',
        createdAt: message.created_at,
      }),
      { status: 201 }
    )

    await logAPIRequest(context, request, 201, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Messages API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to send message'),
      { status: 500 }
    )
  }
}
