/**
 * Contacts API Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/v1/contacts - List contacts
 * POST /api/v1/contacts - Create a contact
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
import { dispatchContactCreated } from '@/lib/api'

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
  const scopeError = requireScope('contacts:read')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const search = searchParams.get('search')
    const optedIn = searchParams.get('opted_in')

    // Build query
    const where: Record<string, unknown> = {
      organization_id: context.organizationId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone_number: { contains: search } },
        { profile_name: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (optedIn !== null && optedIn !== undefined) {
      where.opted_in = optedIn === 'true'
    }

    // Get total count
    const total = await prisma.whatsapp_contacts.count({ where })

    // Get contacts
    const contacts = await prisma.whatsapp_contacts.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        phone_number: true,
        name: true,
        profile_name: true,
        is_blocked: true,
        opted_in: true,
        opted_in_at: true,
        last_message_at: true,
        created_at: true,
        updated_at: true,
      },
    })

    const response = NextResponse.json(
      paginatedResponse(
        contacts.map((c) => ({
          id: c.id,
          phoneNumber: c.phone_number,
          name: c.name,
          profileName: c.profile_name,
          isBlocked: c.is_blocked,
          optedIn: c.opted_in,
          optedInAt: c.opted_in_at,
          lastMessageAt: c.last_message_at,
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
    console.error('Contacts API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to fetch contacts'),
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
  const scopeError = requireScope('contacts:write')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.phoneNumber) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Missing required field: phoneNumber'),
        { status: 400 }
      )
    }

    if (!body.whatsappAccountId) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Missing required field: whatsappAccountId'),
        { status: 400 }
      )
    }

    // Check if contact already exists
    const existing = await prisma.whatsapp_contacts.findFirst({
      where: {
        organization_id: context.organizationId,
        whatsapp_account_id: body.whatsappAccountId,
        phone_number: body.phoneNumber,
      },
    })

    if (existing) {
      return NextResponse.json(
        errorResponse(
          'DUPLICATE_ERROR',
          'Contact with this phone number already exists',
          { existingContactId: existing.id }
        ),
        { status: 409 }
      )
    }

    // Create contact
    const contact = await prisma.whatsapp_contacts.create({
      data: {
        organization_id: context.organizationId,
        whatsapp_account_id: body.whatsappAccountId,
        phone_number: body.phoneNumber,
        name: body.name || null,
        profile_name: body.profileName || null,
      },
    })

    // Dispatch webhook
    await dispatchContactCreated(context.organizationId, {
      id: contact.id,
      phoneNumber: contact.phone_number,
      name: contact.name,
      createdAt: contact.created_at,
    })

    const response = NextResponse.json(
      successResponse({
        id: contact.id,
        phoneNumber: contact.phone_number,
        name: contact.name,
        profileName: contact.profile_name,
        optedIn: contact.opted_in,
        createdAt: contact.created_at,
      }),
      { status: 201 }
    )

    await logAPIRequest(context, request, 201, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Contacts API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to create contact'),
      { status: 500 }
    )
  }
}
