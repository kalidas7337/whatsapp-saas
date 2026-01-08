/**
 * Conversations API Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/v1/conversations - List conversations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  validateAPIKey,
  requireScope,
  checkRateLimit,
  addRateLimitHeaders,
  logAPIRequest,
  errorResponse,
  paginatedResponse,
} from '@/lib/api'

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
  const scopeError = requireScope('conversations:read')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assigned_to')
    const contactId = searchParams.get('contact_id')

    // Build query
    const where: Record<string, unknown> = {
      organization_id: context.organizationId,
    }

    if (status) where.status = status
    if (assignedTo) where.assigned_to = assignedTo
    if (contactId) where.contact_id = contactId

    // Get total count
    const total = await prisma.whatsapp_conversations.count({ where })

    // Get conversations
    const conversations = await prisma.whatsapp_conversations.findMany({
      where,
      orderBy: { last_message_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
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

    const response = NextResponse.json(
      paginatedResponse(
        conversations.map((c) => ({
          id: c.id,
          contact: c.contact
            ? {
                id: c.contact.id,
                phoneNumber: c.contact.phone_number,
                name: c.contact.name,
              }
            : null,
          assignedTo: c.assigned_to,
          status: c.status,
          tags: c.tags,
          unreadCount: c.unread_count,
          messageCount: c.message_count,
          lastMessageAt: c.last_message_at,
          lastMessagePreview: c.last_message_preview,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        })),
        page,
        limit,
        total
      )
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Conversations API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to fetch conversations'),
      { status: 500 }
    )
  }
}
