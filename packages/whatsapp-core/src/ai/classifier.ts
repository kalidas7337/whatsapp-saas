import {
  AIProvider,
  AIProviderConfig,
  ClassificationRequest,
  ClassificationResult,
  ResponseSuggestion,
  Intent,
  CannedResponse,
  Sentiment,
} from './types'
import { OpenAIProvider } from './providers/openai.provider'
import { OllamaProvider } from './providers/ollama.provider'
import { getIntentDefinition, calculatePriority } from './intents'

interface CacheEntry {
  result: ClassificationResult
  timestamp: number
}

/**
 * AI Classifier - Main entry point for message classification
 *
 * Features:
 * - Multi-provider support (OpenAI, Ollama, etc.)
 * - Result caching to reduce API costs
 * - Quick classification for simple patterns
 * - Fallback handling for API failures
 */
export class AIClassifier {
  private provider: AIProvider
  private cache: Map<string, CacheEntry> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes
  private maxCacheSize = 1000

  constructor(config: AIProviderConfig) {
    this.provider = this.createProvider(config)
  }

  private createProvider(config: AIProviderConfig): AIProvider {
    switch (config.provider) {
      case 'openai':
        if (!config.apiKey) throw new Error('OpenAI API key required')
        return new OpenAIProvider(config.apiKey, config.model, config.baseUrl)

      case 'ollama':
        return new OllamaProvider(config.baseUrl, config.model)

      // Add more providers as needed (Gemini, Anthropic, etc.)
      case 'gemini':
        throw new Error('Gemini provider not yet implemented')

      case 'anthropic':
        throw new Error('Anthropic provider not yet implemented')

      default:
        throw new Error(`Unsupported provider: ${config.provider}`)
    }
  }

  /**
   * Classify a message
   */
  async classify(request: ClassificationRequest): Promise<ClassificationResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(request)
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    // Preprocess text
    const cleanedText = this.preprocessText(request.text)

    // Quick classification for simple patterns (saves API calls)
    const quickResult = this.quickClassify(cleanedText)
    if (quickResult) {
      this.setCache(cacheKey, quickResult)
      return quickResult
    }

    // Full AI classification
    const result = await this.provider.classify({
      ...request,
      text: cleanedText,
    })

    // Cache result
    this.setCache(cacheKey, result)

    return result
  }

  /**
   * Classify multiple messages in batch
   */
  async classifyBatch(requests: ClassificationRequest[]): Promise<ClassificationResult[]> {
    return Promise.all(requests.map(req => this.classify(req)))
  }

  /**
   * Get response suggestions
   */
  async suggestResponses(
    intent: Intent,
    context: string,
    cannedResponses: CannedResponse[]
  ): Promise<ResponseSuggestion[]> {
    if (cannedResponses.length === 0) return []

    return this.provider.suggestResponses(intent, context, cannedResponses)
  }

  /**
   * Preprocess text for classification
   */
  private preprocessText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove URLs (replace with placeholder)
      .replace(/https?:\/\/\S+/g, '[URL]')
      // Remove emojis (most common ranges)
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
      // Normalize quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Trim
      .trim()
  }

  /**
   * Quick classification for obvious patterns (no API call needed)
   */
  private quickClassify(text: string): ClassificationResult | null {
    const lower = text.toLowerCase().trim()

    // Greeting patterns
    if (/^(hi|hello|hey|good\s+(morning|afternoon|evening)|namaste|hola)[\s!.,]*$/i.test(lower)) {
      return this.buildQuickResult('greeting', 'positive', 0.99)
    }

    // Gratitude patterns
    if (/^(thank|thanks|thank\s+you|thx|ty|धन्यवाद|shukriya)[\s!.,]*$/i.test(lower)) {
      return this.buildQuickResult('gratitude', 'positive', 0.99)
    }

    // Yes/No responses (might need context)
    if (/^(yes|no|ok|okay|sure|alright|fine)[\s!.,]*$/i.test(lower)) {
      return null // Let AI handle with context
    }

    // Very short messages that need context
    if (lower.length < 5) {
      return null // Let AI handle
    }

    return null
  }

  private buildQuickResult(
    intent: Intent,
    sentiment: Sentiment,
    confidence: number
  ): ClassificationResult {
    const intentDef = getIntentDefinition(intent)

    return {
      intent,
      intentCategory: intentDef.category,
      confidence,
      sentiment,
      sentimentScore: sentiment === 'positive' ? 0.8 : sentiment === 'negative' ? -0.8 : 0,
      entities: [],
      language: 'en',
      priority: calculatePriority(intent, sentiment, confidence),
      suggestedActions: intentDef.triggerBot
        ? [{ type: 'bot_flow', data: { flowId: intentDef.triggerBot }, confidence: 0.95 }]
        : [],
    }
  }

  /**
   * Cache management
   */
  private getCacheKey(request: ClassificationRequest): string {
    return `${request.organizationId}:${request.text.toLowerCase().trim()}`
  }

  private getFromCache(key: string): ClassificationResult | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheTimeout) {
      this.cache.delete(key)
      return null
    }

    return entry.result
  }

  private setCache(key: string, result: ClassificationResult): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    })
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; maxSize: number; timeout: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      timeout: this.cacheTimeout,
    }
  }
}

/**
 * Factory function to create a classifier with sensible defaults
 */
export function createClassifier(
  provider: AIProviderConfig['provider'] = 'openai',
  apiKey?: string,
  options?: Partial<AIProviderConfig>
): AIClassifier {
  return new AIClassifier({
    provider,
    apiKey: apiKey || process.env.OPENAI_API_KEY,
    model: options?.model || (provider === 'openai' ? 'gpt-4-turbo-preview' : 'llama2'),
    baseUrl: options?.baseUrl,
    temperature: options?.temperature || 0.3,
    maxTokens: options?.maxTokens || 500,
  })
}
