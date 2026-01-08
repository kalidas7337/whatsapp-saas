/**
 * Canned Response By ID API
 *
 * GET /api/ai/canned-responses/[id] - Get a single response
 * PUT /api/ai/canned-responses/[id] - Update a response
 * DELETE /api/ai/canned-responses/[id] - Delete a response
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

// Update validation schema
const UpdateResponseSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(2000).optional(),
  shortcut: z.string().max(20).optional().nullable(),
  category: z.string().min(1).max(50).optional(),
  tags: z.array(z.string()).optional(),
  matchingIntents: z.array(z.enum(VALID_INTENTS)).optional(),
  matchingSentiments: z.array(z.enum(VALID_SENTIMENTS)).optional(),
  isActive: z.boolean().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params

    // Fetch response
    const response = await prisma.whatsapp_canned_responses?.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
      },
    })

    if (!response) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Get canned response error:', error)
    return NextResponse.json(
      { error: 'Failed to get response', message: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const validation = UpdateResponseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Check if response exists
    const existing = await prisma.whatsapp_canned_responses?.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      )
    }

    // Check for duplicate shortcut
    if (updates.shortcut && updates.shortcut !== existing.shortcut) {
      const duplicate = await prisma.whatsapp_canned_responses?.findFirst({
        where: {
          organization_id: user.organizationId,
          shortcut: updates.shortcut,
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Shortcut already exists' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    }

    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.content !== undefined) updateData.content = updates.content
    if (updates.shortcut !== undefined) updateData.shortcut = updates.shortcut
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.matchingIntents !== undefined) updateData.matching_intents = updates.matchingIntents
    if (updates.matchingSentiments !== undefined) updateData.matching_sentiments = updates.matchingSentiments
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    // Update response
    const response = await prisma.whatsapp_canned_responses?.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Update canned response error:', error)
    return NextResponse.json(
      { error: 'Failed to update response', message: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params

    // Check if response exists
    const existing = await prisma.whatsapp_canned_responses?.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      )
    }

    // Delete response
    await prisma.whatsapp_canned_responses?.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Response deleted successfully',
    })
  } catch (error) {
    console.error('Delete canned response error:', error)
    return NextResponse.json(
      { error: 'Failed to delete response', message: (error as Error).message },
      { status: 500 }
    )
  }
}
