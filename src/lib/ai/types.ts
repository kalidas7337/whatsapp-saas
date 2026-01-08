/**
 * AI Service Types for WhatsApp Standalone App
 *
 * Extends core AI types with database integration
 */

import type {
  Intent,
  Sentiment,
  Priority,
  ClassificationResult,
  Entity,
  SuggestedAction,
} from '@repo/whatsapp-core'

// ============================================================
// Database Models
// ============================================================

export interface AIClassificationLog {
  id: string
  organizationId: string
  messageId: string
  conversationId: string

  // Classification results
  intent: Intent
  intentCategory: string
  confidence: number
  sentiment: Sentiment
  sentimentScore: number
  priority: Priority
  language: string

  // JSON fields
  entities: Entity[]
  suggestedActions: SuggestedAction[]
  rawResponse?: unknown

  // Metadata
  processingTimeMs: number
  provider: string
  model: string
  cached: boolean

  createdAt: Date
}

export interface CannedResponseDB {
  id: string
  organizationId: string

  // Content
  title: string
  content: string
  shortcut?: string

  // Categorization
  category: string
  tags: string[]

  // Intent matching
  matchingIntents: Intent[]
  matchingSentiments: Sentiment[]

  // Usage stats
  usageCount: number
  successRate: number
  lastUsedAt?: Date

  // Status
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface AITrainingData {
  id: string
  organizationId: string

  // Original message
  messageText: string
  messageId?: string

  // Classification
  originalIntent: Intent
  originalConfidence: number

  // Correction
  correctedIntent: Intent
  correctedBy: string
  correctedAt: Date

  // Training status
  usedForTraining: boolean
  trainedAt?: Date

  createdAt: Date
}

// ============================================================
// Service Configuration
// ============================================================

export interface AIServiceConfig {
  // Provider settings
  provider: 'openai' | 'ollama' | 'gemini' | 'anthropic'
  apiKey?: string
  model?: string
  baseUrl?: string

  // Feature flags
  enableAutoClassification: boolean
  enableSuggestions: boolean
  enableRouting: boolean

  // Thresholds
  minConfidenceThreshold: number
  autoRouteMinConfidence: number

  // Caching
  cacheEnabled: boolean
  cacheTtlSeconds: number
}

export const DEFAULT_AI_CONFIG: AIServiceConfig = {
  provider: 'openai',
  enableAutoClassification: true,
  enableSuggestions: true,
  enableRouting: true,
  minConfidenceThreshold: 0.6,
  autoRouteMinConfidence: 0.8,
  cacheEnabled: true,
  cacheTtlSeconds: 300,
}

// ============================================================
// Service Response Types
// ============================================================

export interface ClassifyMessageResult {
  classification: ClassificationResult
  log: AIClassificationLog
  suggestions?: SuggestedResponseResult[]
  routingDecision?: RoutingDecision
}

export interface SuggestedResponseResult {
  response: CannedResponseDB
  relevanceScore: number
  matchReason: string
}

export interface RoutingDecision {
  shouldRoute: boolean
  targetTeam?: string
  targetUserId?: string
  reason: string
  confidence: number
}

// ============================================================
// Training & Feedback
// ============================================================

export interface ClassificationFeedback {
  messageId: string
  originalIntent: Intent
  correctedIntent: Intent
  correctedBy: string
  feedback?: string
}

export interface TrainingStats {
  totalFeedback: number
  intentAccuracy: Record<Intent, number>
  overallAccuracy: number
  lastTrainedAt?: Date
  pendingFeedback: number
}

// ============================================================
// Analytics
// ============================================================

export interface AIAnalytics {
  period: {
    start: Date
    end: Date
  }

  // Classification stats
  totalClassifications: number
  averageConfidence: number
  cacheHitRate: number
  averageProcessingTimeMs: number

  // Intent distribution
  intentDistribution: Record<Intent, number>

  // Sentiment distribution
  sentimentDistribution: Record<Sentiment, number>

  // Priority distribution
  priorityDistribution: Record<Priority, number>

  // Language distribution
  languageDistribution: Record<string, number>

  // Provider stats
  providerStats: {
    provider: string
    calls: number
    avgLatency: number
    errorRate: number
  }[]

  // Suggestions stats
  suggestionStats: {
    totalSuggested: number
    accepted: number
    acceptanceRate: number
  }
}
