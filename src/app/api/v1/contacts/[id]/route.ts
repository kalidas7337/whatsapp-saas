/**
 * Single Contact API Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/v1/contacts/:id - Get a single contact
 * PATCH /api/v1/contacts/:id - Update a contact
 * DELETE /api/v1/contacts/:id - Delete a contact
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
import { dispatchContactUpdated } from '@/lib/api'

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
  const scopeError = requireScope('contacts:read')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    const contact = await prisma.whatsapp_contacts.findFirst({
      where: {
        id,
        organization_id: context.organizationId,
      },
      include: {
        conversations: {
          select: {
            id: true,
            status: true,
            last_message_at: true,
          },
          orderBy: { last_message_at: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            messages: true,
            conversations: true,
          },
        },
      },
    })

    if (!contact) {
      await logAPIRequest(context, request, 404, Date.now() - startTime)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Contact not found'),
        { status: 404 }
      )
    }

    const response = NextResponse.json(
      successResponse({
        id: contact.id,
        phoneNumber: contact.phone_number,
        name: contact.name,
        profileName: contact.profile_name,
        isBlocked: contact.is_blocked,
        optedIn: contact.opted_in,
        optedInAt: contact.opted_in_at,
        lastMessageAt: contact.last_message_at,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at,
        stats: {
          totalMessages: contact._count.messages,
          totalConversations: contact._count.conversations,
        },
        recentConversations: contact.conversations.map((c) => ({
          id: c.id,
          status: c.status,
          lastMessageAt: c.last_message_at,
        })),
      })
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Contact API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to fetch contact'),
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
  const scopeError = requireScope('contacts:write')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    // Check if contact exists
    const existing = await prisma.whatsapp_contacts.findFirst({
      where: {
        id,
        organization_id: context.organizationId,
      },
    })

    if (!existing) {
      await logAPIRequest(context, request, 404, Date.now() - startTime)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Contact not found'),
        { status: 404 }
      )
    }

    const body = await request.json()

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.isBlocked !== undefined) updateData.is_blocked = body.isBlocked
    if (body.optedIn !== undefined) {
      updateData.opted_in = body.optedIn
      if (body.optedIn && !existing.opted_in) {
        updateData.opted_in_at = new Date()
      }
    }

    const contact = await prisma.whatsapp_contacts.update({
      where: { id },
      data: updateData,
    })

    // Dispatch webhook
    await dispatchContactUpdated(context.organizationId, {
      id: contact.id,
      phoneNumber: contact.phone_number,
      name: contact.name,
      updatedAt: contact.updated_at,
    })

    const response = NextResponse.json(
      successResponse({
        id: contact.id,
        phoneNumber: contact.phone_number,
        name: contact.name,
        profileName: contact.profile_name,
        isBlocked: contact.is_blocked,
        optedIn: contact.opted_in,
        optedInAt: contact.opted_in_at,
        updatedAt: contact.updated_at,
      })
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Contact API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to update contact'),
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
  const scopeError = requireScope('contacts:write')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    // Check if contact exists
    const existing = await prisma.whatsapp_contacts.findFirst({
      where: {
        id,
        organization_id: context.organizationId,
      },
    })

    if (!existing) {
      await logAPIRequest(context, request, 404, Date.now() - startTime)
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Contact not found'),
        { status: 404 }
      )
    }

    // Delete contact (cascades to messages and conversations)
    await prisma.whatsapp_contacts.delete({
      where: { id },
    })

    const response = NextResponse.json(
      successResponse({ deleted: true, id }),
      { status: 200 }
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Contact API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to delete contact'),
      { status: 500 }
    )
  }
}
