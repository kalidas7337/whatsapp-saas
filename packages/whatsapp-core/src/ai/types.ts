/**
 * AI Classification Types
 */

export type IntentCategory =
  | 'support'
  | 'sales'
  | 'administrative'
  | 'other'

export type Intent =
  // Support
  | 'general_inquiry'
  | 'product_inquiry'
  | 'pricing_inquiry'
  | 'order_status'
  | 'complaint'
  | 'feedback'
  | 'technical_support'
  // Sales
  | 'purchase_intent'
  | 'quote_request'
  | 'negotiation'
  | 'follow_up'
  // Administrative
  | 'appointment_booking'
  | 'document_request'
  | 'account_update'
  | 'cancellation'
  // Other
  | 'greeting'
  | 'gratitude'
  | 'spam'
  | 'unknown'

export type Sentiment = 'positive' | 'negative' | 'neutral'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Entity {
  type: string
  value: string
  confidence: number
  position?: { start: number; end: number }
}

export interface ClassificationResult {
  intent: Intent
  intentCategory: IntentCategory
  confidence: number
  sentiment: Sentiment
  sentimentScore: number  // -1 to 1
  entities: Entity[]
  language: string
  priority: Priority
  suggestedActions: SuggestedAction[]
  rawResponse?: unknown
}

export interface SuggestedAction {
  type: 'response' | 'route' | 'bot_flow' | 'escalate' | 'tag'
  data: Record<string, unknown>
  confidence: number
}

export interface ResponseSuggestion {
  id: string
  text: string
  category: string
  matchScore: number
  variables?: Record<string, string>
}

export interface ClassificationRequest {
  messageId: string
  text: string
  conversationId?: string
  contactId?: string
  previousMessages?: string[]
  organizationId: string
}

export interface AIProviderConfig {
  provider: 'openai' | 'gemini' | 'ollama' | 'anthropic'
  apiKey?: string
  model?: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
}

export interface AIProvider {
  classify(request: ClassificationRequest): Promise<ClassificationResult>
  suggestResponses(
    intent: Intent,
    context: string,
    responses: CannedResponse[]
  ): Promise<ResponseSuggestion[]>
}

export interface CannedResponse {
  id: string
  text: string
  category: string
  variables?: string[]
}

export interface IntentDefinition {
  category: IntentCategory
  description: string
  keywords: string[]
  defaultPriority: Priority
  autoRoute?: string
  triggerBot?: string
}
