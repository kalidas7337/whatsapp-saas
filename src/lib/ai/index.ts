/**
 * AI Module Exports for WhatsApp Standalone App
 */

// Service
export {
  AIService,
  createAIService,
  getAIService,
  clearAIServiceCache,
} from './ai.service'

// Types
export * from './types'

// Re-export core AI types for convenience
export {
  // Types
  type Intent,
  type Sentiment,
  type Priority,
  type ClassificationResult,
  type Entity,
  type SuggestedAction,
  type AIProviderConfig,
  type ClassificationRequest,
  type CannedResponse,
  type ResponseSuggestion,
  type IntentCategory,
  // Utilities
  preprocessText,
  detectLanguage,
  extractEntities,
  normalizeText,
  isLikelySpam,
  // Intent utilities
  getIntentDefinition,
  getIntentLabel,
  calculatePriority,
  INTENT_DEFINITIONS,
} from '@repo/whatsapp-core'
