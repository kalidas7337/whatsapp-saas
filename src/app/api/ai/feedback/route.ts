/**
 * AI Feedback API
 *
 * POST /api/ai/feedback - Record classification feedback
 * GET /api/ai/feedback - Get training statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIService, type Intent } from '@/lib/ai'
import { z } from 'zod'

// Valid intents
const VALID_INTENTS = [
  'general_inquiry', 'product_inquiry', 'pricing_inquiry', 'order_status',
  'complaint', 'feedback', 'technical_support', 'purchase_intent',
  'quote_request', 'negotiation', 'follow_up', 'appointment_booking',
  'document_request', 'account_update', 'cancellation', 'greeting',
  'gratitude', 'spam', 'unknown',
] as const

// Request validation schema
const FeedbackRequestSchema = z.object({
  messageId: z.string().min(1),
  originalIntent: z.enum(VALID_INTENTS),
  correctedIntent: z.enum(VALID_INTENTS),
  feedback: z.string().optional(),
})

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
    const validation = FeedbackRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { messageId, originalIntent, correctedIntent, feedback } = validation.data

    // Get AI service and record feedback
    const aiService = getAIService(user.organizationId)
    await aiService.recordFeedback({
      messageId,
      originalIntent: originalIntent as Intent,
      correctedIntent: correctedIntent as Intent,
      correctedBy: user.id || 'unknown',
      feedback,
    })

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
    })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to record feedback', message: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET() {
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

    // Get AI service and training stats
    const aiService = getAIService(user.organizationId)
    const stats = await aiService.getTrainingStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Training stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get training stats', message: (error as Error).message },
      { status: 500 }
    )
  }
}
