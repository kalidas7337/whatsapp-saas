/**
 * AI Classification Service for WhatsApp Standalone App
 *
 * Integrates the core AI classifier with database storage
 * and provides high-level methods for message classification.
 */

import {
  AIClassifier,
  createClassifier,
  ClassificationResult,
  Intent,
  Sentiment,
  preprocessText,
  isLikelySpam,
  type CannedResponse,
  type ResponseSuggestion,
} from '@repo/whatsapp-core'

import { prisma } from '../prisma'
import {
  DEFAULT_AI_CONFIG,
  type AIServiceConfig,
  type AIClassificationLog,
  type CannedResponseDB,
  type ClassifyMessageResult,
  type SuggestedResponseResult,
  type RoutingDecision,
  type ClassificationFeedback,
  type TrainingStats,
  type AIAnalytics,
} from './types'

/**
 * AI Service - Main entry point for message classification
 */
export class AIService {
  private classifier: AIClassifier
  private config: AIServiceConfig
  private organizationId: string

  constructor(organizationId: string, config?: Partial<AIServiceConfig>) {
    this.organizationId = organizationId
    this.config = { ...DEFAULT_AI_CONFIG, ...config }

    // Initialize classifier based on config
    this.classifier = createClassifier(
      this.config.provider,
      this.config.apiKey,
      {
        model: this.config.model,
        baseUrl: this.config.baseUrl,
      }
    )
  }

  /**
   * Classify a message and store results
   */
  async classifyMessage(
    messageId: string,
    conversationId: string,
    messageText: string,
    context?: string
  ): Promise<ClassifyMessageResult> {
    const startTime = Date.now()

    // Preprocess and check for spam
    const preprocessed = preprocessText(messageText)
    if (isLikelySpam(preprocessed.original)) {
      const spamResult = this.buildSpamResult()
      const log = await this.storeClassificationLog(
        messageId,
        conversationId,
        spamResult,
        Date.now() - startTime,
        false
      )
      return { classification: spamResult, log }
    }

    // Perform classification
    const classification = await this.classifier.classify({
      messageId,
      text: messageText,
      organizationId: this.organizationId,
      conversationId,
      previousMessages: context ? [context] : undefined,
    })

    // Check confidence threshold
    if (classification.confidence < this.config.minConfidenceThreshold) {
      classification.intent = 'unknown'
    }

    const processingTime = Date.now() - startTime
    const cached = processingTime < 50 // Likely cached if very fast

    // Store classification log
    const log = await this.storeClassificationLog(
      messageId,
      conversationId,
      classification,
      processingTime,
      cached
    )

    // Get suggested responses if enabled
    let suggestions: SuggestedResponseResult[] | undefined
    if (this.config.enableSuggestions) {
      suggestions = await this.getSuggestionsForIntent(classification.intent, messageText)
    }

    // Determine routing if enabled
    let routingDecision: RoutingDecision | undefined
    if (this.config.enableRouting && classification.confidence >= this.config.autoRouteMinConfidence) {
      routingDecision = await this.determineRouting(classification)
    }

    return {
      classification,
      log,
      suggestions,
      routingDecision,
    }
  }

  /**
   * Get response suggestions for an intent
   */
  async getSuggestionsForIntent(
    intent: Intent,
    context: string
  ): Promise<SuggestedResponseResult[]> {
    // Fetch canned responses for this organization that match the intent
    const cannedResponses = await prisma.whatsapp_canned_responses?.findMany({
      where: {
        organization_id: this.organizationId,
        is_active: true,
        OR: [
          { matching_intents: { has: intent } },
          { matching_intents: { isEmpty: true } }, // Universal responses
        ],
      },
      orderBy: { usage_count: 'desc' },
      take: 10,
    }).catch(() => [])

    if (!cannedResponses || cannedResponses.length === 0) {
      return []
    }

    // Convert to CannedResponse format for the classifier
    const responses: CannedResponse[] = cannedResponses.map((r) => ({
      id: r.id,
      text: r.content,
      category: r.category,
      variables: r.tags,
    }))

    // Get AI-powered suggestions
    const aiSuggestions = await this.classifier.suggestResponses(
      intent,
      context,
      responses
    )

    // Map back to our format with DB data
    return aiSuggestions.map((suggestion: ResponseSuggestion) => {
      const dbResponse = cannedResponses.find((r) => r.id === suggestion.id)
      if (!dbResponse) return null
      return {
        response: {
          ...dbResponse,
          organizationId: dbResponse.organization_id,
          matchingIntents: dbResponse.matching_intents as Intent[],
          matchingSentiments: dbResponse.matching_sentiments as Sentiment[],
          usageCount: dbResponse.usage_count,
          successRate: dbResponse.success_rate,
          lastUsedAt: dbResponse.last_used_at || undefined,
          isActive: dbResponse.is_active,
          createdBy: dbResponse.created_by,
          createdAt: dbResponse.created_at,
          updatedAt: dbResponse.updated_at,
        } as CannedResponseDB,
        relevanceScore: suggestion.matchScore,
        matchReason: `Matched with ${(suggestion.matchScore * 100).toFixed(0)}% relevance`,
      }
    }).filter((s): s is SuggestedResponseResult => s !== null)
  }

  /**
   * Determine routing based on classification
   */
  private async determineRouting(
    classification: ClassificationResult
  ): Promise<RoutingDecision> {
    // Get routing rules based on intent
    const routingRules = this.getRoutingRules()
    const intentRule = routingRules[classification.intent]

    if (!intentRule) {
      return {
        shouldRoute: false,
        reason: 'No routing rule for intent',
        confidence: classification.confidence,
      }
    }

    // Priority-based routing for high priority items
    if (classification.priority === 'urgent' || classification.priority === 'high') {
      // Find available team member
      const targetUser = await this.findAvailableTeamMember(intentRule.team)

      return {
        shouldRoute: true,
        targetTeam: intentRule.team,
        targetUserId: targetUser?.id,
        reason: `High priority ${classification.intent} routed to ${intentRule.team}`,
        confidence: classification.confidence,
      }
    }

    // Standard routing
    return {
      shouldRoute: true,
      targetTeam: intentRule.team,
      reason: `${classification.intent} routed to ${intentRule.team}`,
      confidence: classification.confidence,
    }
  }

  /**
   * Get routing rules for intents
   */
  private getRoutingRules(): Record<Intent, { team: string; priority?: number }> {
    return {
      general_inquiry: { team: 'support' },
      product_inquiry: { team: 'sales' },
      pricing_inquiry: { team: 'sales' },
      order_status: { team: 'support' },
      complaint: { team: 'support', priority: 1 },
      feedback: { team: 'support' },
      technical_support: { team: 'support', priority: 1 },
      purchase_intent: { team: 'sales', priority: 1 },
      quote_request: { team: 'sales', priority: 1 },
      negotiation: { team: 'sales' },
      follow_up: { team: 'sales' },
      appointment_booking: { team: 'support' },
      document_request: { team: 'support' },
      account_update: { team: 'support' },
      cancellation: { team: 'support', priority: 1 },
      greeting: { team: 'bot' },
      gratitude: { team: 'bot' },
      spam: { team: 'bot' },
      unknown: { team: 'support' },
    }
  }

  /**
   * Find available team member
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async findAvailableTeamMember(team: string): Promise<{ id: string } | null> {
    // TODO: Integrate with team management system to find available team member for the given team
    // For now, return null to indicate no specific user assignment
    return null
  }

  /**
   * Store classification log in database
   */
  private async storeClassificationLog(
    messageId: string,
    conversationId: string,
    classification: ClassificationResult,
    processingTimeMs: number,
    cached: boolean
  ): Promise<AIClassificationLog> {
    const log: AIClassificationLog = {
      id: crypto.randomUUID(),
      organizationId: this.organizationId,
      messageId,
      conversationId,
      intent: classification.intent,
      intentCategory: classification.intentCategory,
      confidence: classification.confidence,
      sentiment: classification.sentiment,
      sentimentScore: classification.sentimentScore,
      priority: classification.priority,
      language: classification.language,
      entities: classification.entities,
      suggestedActions: classification.suggestedActions,
      rawResponse: classification.rawResponse,
      processingTimeMs,
      provider: this.config.provider,
      model: this.config.model || 'default',
      cached,
      createdAt: new Date(),
    }

    // Store in database if table exists
    try {
      await prisma.ai_classification_logs?.create({
        data: {
          id: log.id,
          organization_id: log.organizationId,
          message_id: log.messageId,
          conversation_id: log.conversationId,
          intent: log.intent,
          intent_category: log.intentCategory,
          confidence: log.confidence,
          sentiment: log.sentiment,
          sentiment_score: log.sentimentScore,
          priority: log.priority,
          language: log.language,
          entities: log.entities as unknown as undefined,
          suggested_actions: log.suggestedActions as unknown as undefined,
          raw_response: log.rawResponse as unknown as undefined,
          processing_time_ms: log.processingTimeMs,
          provider: log.provider,
          model: log.model,
          cached: log.cached,
          created_at: log.createdAt,
        },
      })
    } catch (error) {
      // Table might not exist yet, log but don't fail
      console.warn('Failed to store classification log:', error)
    }

    return log
  }

  /**
   * Build spam classification result
   */
  private buildSpamResult(): ClassificationResult {
    return {
      intent: 'spam',
      intentCategory: 'other',
      confidence: 0.95,
      sentiment: 'neutral',
      sentimentScore: 0,
      entities: [],
      language: 'en',
      priority: 'low',
      suggestedActions: [{ type: 'tag', data: { tag: 'spam' }, confidence: 0.9 }],
    }
  }

  /**
   * Record feedback for classification
   */
  async recordFeedback(feedback: ClassificationFeedback): Promise<void> {
    try {
      await prisma.ai_training_data?.create({
        data: {
          id: crypto.randomUUID(),
          organization_id: this.organizationId,
          message_id: feedback.messageId,
          message_text: '', // Would need to fetch from message
          original_intent: feedback.originalIntent,
          original_confidence: 0, // Would need to fetch from log
          corrected_intent: feedback.correctedIntent,
          corrected_by: feedback.correctedBy,
          corrected_at: new Date(),
          used_for_training: false,
          created_at: new Date(),
        },
      })
    } catch (error) {
      console.warn('Failed to record feedback:', error)
    }
  }

  /**
   * Get training statistics
   */
  async getTrainingStats(): Promise<TrainingStats> {
    try {
      const feedback = await prisma.ai_training_data?.findMany({
        where: { organization_id: this.organizationId },
      })

      if (!feedback || feedback.length === 0) {
        return {
          totalFeedback: 0,
          intentAccuracy: {} as Record<Intent, number>,
          overallAccuracy: 0,
          pendingFeedback: 0,
        }
      }

      // Calculate accuracy by intent
      const intentCounts: Record<Intent, { correct: number; total: number }> = {} as Record<Intent, { correct: number; total: number }>
      let correctTotal = 0

      feedback.forEach((f: { original_intent: Intent; corrected_intent: Intent }) => {
        const intent = f.original_intent as Intent
        if (!intentCounts[intent]) {
          intentCounts[intent] = { correct: 0, total: 0 }
        }
        intentCounts[intent].total++
        if (f.original_intent === f.corrected_intent) {
          intentCounts[intent].correct++
          correctTotal++
        }
      })

      const intentAccuracy: Record<Intent, number> = {} as Record<Intent, number>
      Object.entries(intentCounts).forEach(([intent, counts]) => {
        intentAccuracy[intent as Intent] = counts.correct / counts.total
      })

      const pendingFeedback = feedback.filter((f: { used_for_training: boolean }) => !f.used_for_training).length

      return {
        totalFeedback: feedback.length,
        intentAccuracy,
        overallAccuracy: correctTotal / feedback.length,
        pendingFeedback,
      }
    } catch {
      return {
        totalFeedback: 0,
        intentAccuracy: {} as Record<Intent, number>,
        overallAccuracy: 0,
        pendingFeedback: 0,
      }
    }
  }

  /**
   * Get AI analytics for a period
   */
  async getAnalytics(startDate: Date, endDate: Date): Promise<AIAnalytics> {
    try {
      const logs = await prisma.ai_classification_logs?.findMany({
        where: {
          organization_id: this.organizationId,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      if (!logs || logs.length === 0) {
        return this.buildEmptyAnalytics(startDate, endDate)
      }

      // Calculate distributions
      const intentDistribution: Record<Intent, number> = {} as Record<Intent, number>
      const sentimentDistribution: Record<Sentiment, number> = {
        positive: 0,
        negative: 0,
        neutral: 0,
      }
      const priorityDistribution: Record<string, number> = {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0,
      }
      const languageDistribution: Record<string, number> = {}

      let totalConfidence = 0
      let totalProcessingTime = 0
      let cachedCount = 0

      logs.forEach((log: { intent: Intent; sentiment: Sentiment; priority: string; language: string; confidence: number; processing_time_ms: number; cached: boolean }) => {
        // Intent distribution
        intentDistribution[log.intent as Intent] = (intentDistribution[log.intent as Intent] || 0) + 1

        // Sentiment distribution
        sentimentDistribution[log.sentiment as Sentiment]++

        // Priority distribution
        priorityDistribution[log.priority]++

        // Language distribution
        languageDistribution[log.language] = (languageDistribution[log.language] || 0) + 1

        // Aggregates
        totalConfidence += log.confidence
        totalProcessingTime += log.processing_time_ms
        if (log.cached) cachedCount++
      })

      return {
        period: { start: startDate, end: endDate },
        totalClassifications: logs.length,
        averageConfidence: totalConfidence / logs.length,
        cacheHitRate: cachedCount / logs.length,
        averageProcessingTimeMs: totalProcessingTime / logs.length,
        intentDistribution,
        sentimentDistribution,
        priorityDistribution: priorityDistribution as Record<string, number>,
        languageDistribution,
        providerStats: [
          {
            provider: this.config.provider,
            calls: logs.length - cachedCount,
            avgLatency: totalProcessingTime / (logs.length - cachedCount || 1),
            errorRate: 0,
          },
        ],
        suggestionStats: {
          totalSuggested: 0,
          accepted: 0,
          acceptanceRate: 0,
        },
      }
    } catch {
      return this.buildEmptyAnalytics(startDate, endDate)
    }
  }

  /**
   * Build empty analytics response
   */
  private buildEmptyAnalytics(startDate: Date, endDate: Date): AIAnalytics {
    return {
      period: { start: startDate, end: endDate },
      totalClassifications: 0,
      averageConfidence: 0,
      cacheHitRate: 0,
      averageProcessingTimeMs: 0,
      intentDistribution: {} as Record<Intent, number>,
      sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
      priorityDistribution: { urgent: 0, high: 0, medium: 0, low: 0 },
      languageDistribution: {},
      providerStats: [],
      suggestionStats: { totalSuggested: 0, accepted: 0, acceptanceRate: 0 },
    }
  }

  /**
   * Clear classifier cache
   */
  clearCache(): void {
    this.classifier.clearCache()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.classifier.getCacheStats()
  }

  /**
   * Update a canned response usage
   */
  async recordResponseUsage(responseId: string, successful: boolean): Promise<void> {
    try {
      await prisma.whatsapp_canned_responses?.update({
        where: { id: responseId },
        data: {
          usage_count: { increment: 1 },
          success_rate: successful ? { increment: 0.01 } : { decrement: 0.01 },
          last_used_at: new Date(),
        },
      })
    } catch (error) {
      console.warn('Failed to record response usage:', error)
    }
  }
}

/**
 * Factory function to create AI service with environment configuration
 */
export function createAIService(organizationId: string): AIService {
  const config: Partial<AIServiceConfig> = {
    provider: (process.env.AI_PROVIDER as 'openai' | 'ollama') || 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL,
    baseUrl: process.env.AI_BASE_URL,
    enableAutoClassification: process.env.AI_AUTO_CLASSIFY !== 'false',
    enableSuggestions: process.env.AI_SUGGESTIONS !== 'false',
    enableRouting: process.env.AI_ROUTING !== 'false',
  }

  return new AIService(organizationId, config)
}

// Singleton cache for AI services per organization
const serviceCache = new Map<string, AIService>()

/**
 * Get or create AI service for an organization
 */
export function getAIService(organizationId: string): AIService {
  if (!serviceCache.has(organizationId)) {
    serviceCache.set(organizationId, createAIService(organizationId))
  }
  return serviceCache.get(organizationId)!
}

/**
 * Clear AI service cache
 */
export function clearAIServiceCache(): void {
  serviceCache.forEach(service => service.clearCache())
  serviceCache.clear()
}
