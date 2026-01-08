/**
 * AI Classification API
 *
 * POST /api/ai/classify - Classify a message
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIService } from '@/lib/ai'
import { z } from 'zod'

// Request validation schema
const ClassifyRequestSchema = z.object({
  messageId: z.string().min(1),
  conversationId: z.string().min(1),
  text: z.string().min(1).max(10000),
  context: z.string().optional(),
})

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validation = ClassifyRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { messageId, conversationId, text, context } = validation.data

    // Get AI service and classify
    const aiService = getAIService(user.organizationId)
    const result = await aiService.classifyMessage(
      messageId,
      conversationId,
      text,
      context
    )

    return NextResponse.json({
      success: true,
      data: {
        intent: result.classification.intent,
        intentCategory: result.classification.intentCategory,
        confidence: result.classification.confidence,
        sentiment: result.classification.sentiment,
        sentimentScore: result.classification.sentimentScore,
        priority: result.classification.priority,
        language: result.classification.language,
        entities: result.classification.entities,
        suggestedActions: result.classification.suggestedActions,
        suggestions: result.suggestions?.map(s => ({
          id: s.response.id,
          title: s.response.title,
          content: s.response.content,
          relevanceScore: s.relevanceScore,
          matchReason: s.matchReason,
        })),
        routing: result.routingDecision,
        logId: result.log.id,
      },
    })
  } catch (error) {
    console.error('Classification error:', error)
    return NextResponse.json(
      { error: 'Classification failed', message: (error as Error).message },
      { status: 500 }
    )
  }
}
