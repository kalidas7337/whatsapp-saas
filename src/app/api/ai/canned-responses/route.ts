/**
 * Canned Responses API
 *
 * GET /api/ai/canned-responses - List canned responses
 * POST /api/ai/canned-responses - Create a canned response
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Valid intents and sentiments
const VALID_INTENTS = [
  'general_inquiry', 'product_inquiry', 'pricing_inquiry', 'order_status',
  'complaint', 'feedback', 'technical_support', 'purchase_intent',
  'quote_request', 'negotiation', 'follow_up', 'appointment_booking',
  'document_request', 'account_update', 'cancellation', 'greeting',
  'gratitude', 'spam', 'unknown',
] as const

const VALID_SENTIMENTS = ['positive', 'negative', 'neutral'] as const

// Request validation schema
const CreateResponseSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
  shortcut: z.string().max(20).optional(),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).optional().default([]),
  matchingIntents: z.array(z.enum(VALID_INTENTS)).optional().default([]),
  matchingSentiments: z.array(z.enum(VALID_SENTIMENTS)).optional().default([]),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { organizationId?: string }
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const intent = searchParams.get('intent')
    const activeOnly = searchParams.get('active') !== 'false'

    // Build query
    const where: Record<string, unknown> = {
      organization_id: user.organizationId,
    }

    if (activeOnly) {
      where.is_active = true
    }

    if (category) {
      where.category = category
    }

    if (intent && VALID_INTENTS.includes(intent as typeof VALID_INTENTS[number])) {
      where.matching_intents = { has: intent }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { shortcut: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch responses
    const responses = await prisma.whatsapp_canned_responses?.findMany({
      where,
      orderBy: [
        { usage_count: 'desc' },
        { created_at: 'desc' },
      ],
    }).catch(() => [])

    // Get unique categories
    const categories = await prisma.whatsapp_canned_responses?.groupBy({
      by: ['category'],
      where: { organization_id: user.organizationId },
    }).catch(() => [])

    return NextResponse.json({
      success: true,
      data: {
        responses: responses || [],
        categories: (categories || []).map((c: { category: string }) => c.category),
        total: responses?.length || 0,
      },
    })
  } catch (error) {
    console.error('List canned responses error:', error)
    return NextResponse.json(
      { error: 'Failed to list responses', message: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id?: string; organizationId?: string }
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = CreateResponseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { title, content, shortcut, category, tags, matchingIntents, matchingSentiments } = validation.data

    // Check for duplicate shortcut
    if (shortcut) {
      const existing = await prisma.whatsapp_canned_responses?.findFirst({
        where: {
          organization_id: user.organizationId,
          shortcut,
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Shortcut already exists' },
          { status: 400 }
        )
      }
    }

    // Create response
    const response = await prisma.whatsapp_canned_responses?.create({
      data: {
        id: crypto.randomUUID(),
        organization_id: user.organizationId,
        title,
        content,
        shortcut,
        category,
        tags,
        matching_intents: matchingIntents,
        matching_sentiments: matchingSentiments,
        usage_count: 0,
        success_rate: 0,
        is_active: true,
        created_by: user.id || 'unknown',
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: response,
    }, { status: 201 })
  } catch (error) {
    console.error('Create canned response error:', error)
    return NextResponse.json(
      { error: 'Failed to create response', message: (error as Error).message },
      { status: 500 }
    )
  }
}
