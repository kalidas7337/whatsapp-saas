/**
 * AI Response Suggestions API
 *
 * POST /api/ai/suggest - Get response suggestions for an intent
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
const SuggestRequestSchema = z.object({
  intent: z.enum(VALID_INTENTS),
  context: z.string().min(1).max(5000),
  limit: z.number().min(1).max(10).optional().default(5),
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
    const validation = SuggestRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { intent, context, limit } = validation.data

    // Get AI service and get suggestions
    const aiService = getAIService(user.organizationId)
    const suggestions = await aiService.getSuggestionsForIntent(
      intent as Intent,
      context
    )

    // Limit results
    const limitedSuggestions = suggestions.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        intent,
        suggestions: limitedSuggestions.map(s => ({
          id: s.response.id,
          title: s.response.title,
          content: s.response.content,
          category: s.response.category,
          shortcut: s.response.shortcut,
          relevanceScore: s.relevanceScore,
          matchReason: s.matchReason,
        })),
        total: suggestions.length,
      },
    })
  } catch (error) {
    console.error('Suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to get suggestions', message: (error as Error).message },
      { status: 500 }
    )
  }
}
