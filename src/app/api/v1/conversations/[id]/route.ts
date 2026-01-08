/**
 * Single Conversation API Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/v1/conversations/:id - Get a single conversation
 * PATCH /api/v1/conversations/:id - Update a conversation
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
import {
  dispatchConversationAssigned,
  dispatchConversationResolved,
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
  const scopeError = requireScope('conversations:read')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    const conversation = await prisma.whatsapp_conversations.findFirst({
      where: {
        id,
        organization_id: context.organizationId,
      },
      include: {
        contact: {
          select: {
            id: true,
            phone_number: true,
            name: true,
            profile_name: true,
          },
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 50,
          select: {
            id: true,
            direction: true,
            message_type: true,
            content: true,
            status: true,
            created_at: true,
          },
        },
      },
    })

    if (!conversation) {
      await logAPIRequest(context, request, 404, Date.now() - startTime)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Conversation not found'),
        { status: 404 }
      )
    }

    const response = NextResponse.json(
      successResponse({
        id: conversation.id,
        contact: conversation.contact
          ? {
              id: conversation.contact.id,
              phoneNumber: conversation.contact.phone_number,
              name: conversation.contact.name,
              profileName: conversation.contact.profile_name,
            }
          : null,
        assignedTo: conversation.assigned_to,
        status: conversation.status,
        tags: conversation.tags,
        metadata: conversation.metadata,
        unreadCount: conversation.unread_count,
        messageCount: conversation.message_count,
        lastMessageAt: conversation.last_message_at,
        lastMessagePreview: conversation.last_message_preview,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        recentMessages: conversation.messages.map((m) => ({
          id: m.id,
          direction: m.direction,
          messageType: m.message_type,
          content: m.content,
          status: m.status,
          createdAt: m.created_at,
        })),
      })
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Conversation API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to fetch conversation'),
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
  const scopeError = requireScope('conversations:write')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    // Check if conversation exists
    const existing = await prisma.whatsapp_conversations.findFirst({
      where: {
        id,
        organization_id: context.organizationId,
      },
    })

    if (!existing) {
      await logAPIRequest(context, request, 404, Date.now() - startTime)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Conversation not found'),
        { status: 404 }
      )
    }

    const body = await request.json()

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    }

    if (body.status !== undefined) updateData.status = body.status
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.assignedTo !== undefined) updateData.assigned_to = body.assignedTo
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    const conversation = await prisma.whatsapp_conversations.update({
      where: { id },
      data: updateData,
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

    // Dispatch appropriate webhooks
    if (body.assignedTo !== undefined && body.assignedTo !== existing.assigned_to) {
      await dispatchConversationAssigned(context.organizationId, {
        id: conversation.id,
        contactId: conversation.contact_id,
        assigneeId: body.assignedTo,
        assignedAt: new Date(),
      })
    }

    if (body.status === 'RESOLVED' && existing.status !== 'RESOLVED') {
      await dispatchConversationResolved(context.organizationId, {
        id: conversation.id,
        contactId: conversation.contact_id,
        resolvedAt: new Date(),
      })
    }

    const response = NextResponse.json(
      successResponse({
        id: conversation.id,
        contact: conversation.contact
          ? {
              id: conversation.contact.id,
              phoneNumber: conversation.contact.phone_number,
              name: conversation.contact.name,
            }
          : null,
        assignedTo: conversation.assigned_to,
        status: conversation.status,
        tags: conversation.tags,
        updatedAt: conversation.updated_at,
      })
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Conversation API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to update conversation'),
      { status: 500 }
    )
  }
}
