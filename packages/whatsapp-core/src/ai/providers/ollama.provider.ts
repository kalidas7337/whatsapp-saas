import {
  AIProvider,
  ClassificationRequest,
  ClassificationResult,
  ResponseSuggestion,
  Intent,
  Sentiment,
  CannedResponse,
} from '../types'
import { getIntentDefinition, calculatePriority, INTENT_DEFINITIONS } from '../intents'

interface OllamaResponse {
  response: string
  done: boolean
}

/**
 * Ollama Provider for local AI inference
 * Supports running open-source models locally for privacy and cost savings
 */
export class OllamaProvider implements AIProvider {
  private baseUrl: string
  private model: string

  constructor(baseUrl = 'http://localhost:11434', model = 'llama2') {
    this.baseUrl = baseUrl
    this.model = model
  }

  async classify(request: ClassificationRequest): Promise<ClassificationResult> {
    const prompt = this.buildClassificationPrompt(request.text, request.previousMessages)

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.3,
            num_predict: 500,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json() as OllamaResponse

      try {
        const result = JSON.parse(data.response)
        return this.parseResult(result)
      } catch {
        // Fallback to keyword-based classification if JSON parsing fails
        return this.fallbackClassify(request.text)
      }
    } catch (error) {
      console.error('Ollama classification error:', error)
      // Fallback to keyword-based classification
      return this.fallbackClassify(request.text)
    }
  }

  async suggestResponses(
    intent: Intent,
    context: string,
    responses: CannedResponse[]
  ): Promise<ResponseSuggestion[]> {
    if (responses.length === 0) return []

    // Use keyword matching for local provider (faster and more reliable)
    const intentDef = getIntentDefinition(intent)

    return responses
      .map(r => {
        let score = 0.3 // Base score

        // Match on intent keywords in response text
        const matchedKeywords = intentDef.keywords.filter(k =>
          r.text.toLowerCase().includes(k.toLowerCase())
        )
        score += matchedKeywords.length * 0.15

        // Match on category
        if (r.category.toLowerCase().includes(intent.replace('_', ' ')) ||
            r.category.toLowerCase() === intentDef.category) {
          score += 0.2
        }

        // Match context words in response
        const contextWords = context.toLowerCase().split(/\s+/)
        const responseWords = r.text.toLowerCase().split(/\s+/)
        const commonWords = contextWords.filter(w =>
          w.length > 3 && responseWords.some(rw => rw.includes(w))
        )
        score += Math.min(commonWords.length * 0.1, 0.3)

        return {
          id: r.id,
          text: r.text,
          category: r.category,
          matchScore: Math.min(score, 1),
        }
      })
      .filter(r => r.matchScore > 0.3)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3)
  }

  private buildClassificationPrompt(text: string, previousMessages?: string[]): string {
    const context = previousMessages?.length
      ? `Previous messages:\n${previousMessages.slice(-2).join('\n')}\n\n`
      : ''

    return `Classify this customer message for a business WhatsApp platform.

${context}Message: "${text}"

Available intents: ${Object.keys(INTENT_DEFINITIONS).join(', ')}

Respond with valid JSON only:
{"intent": "string", "confidence": 0.0-1.0, "sentiment": "positive|negative|neutral", "sentimentScore": -1 to 1, "entities": [], "language": "en"}`
  }

  private parseResult(result: Record<string, unknown>): ClassificationResult {
    const intent = this.validateIntent(result.intent as string)
    const intentDef = getIntentDefinition(intent)
    const sentiment = this.validateSentiment(result.sentiment as string)
    const confidence = typeof result.confidence === 'number'
      ? Math.max(0, Math.min(1, result.confidence))
      : 0.6

    return {
      intent,
      intentCategory: intentDef.category,
      confidence,
      sentiment,
      sentimentScore: typeof result.sentimentScore === 'number' ? result.sentimentScore : 0,
      entities: Array.isArray(result.entities) ? result.entities : [],
      language: String(result.language || 'en'),
      priority: calculatePriority(intent, sentiment, confidence),
      suggestedActions: [],
    }
  }

  private validateIntent(intent: string | undefined): Intent {
    if (intent && intent in INTENT_DEFINITIONS) {
      return intent as Intent
    }
    return 'unknown'
  }

  private validateSentiment(sentiment: string | undefined): Sentiment {
    if (sentiment === 'positive' || sentiment === 'negative' || sentiment === 'neutral') {
      return sentiment
    }
    return 'neutral'
  }

  private fallbackClassify(text: string): ClassificationResult {
    const lowerText = text.toLowerCase().trim()

    // Quick patterns for common intents
    if (/^(hi|hello|hey|good\s+(morning|afternoon|evening)|namaste)[\s!.]*$/i.test(lowerText)) {
      return this.buildResult('greeting', 'positive', 0.95)
    }

    if (/^(thank|thanks|thank\s+you|appreciate|grateful)[\s!.]*$/i.test(lowerText)) {
      return this.buildResult('gratitude', 'positive', 0.95)
    }

    // Keyword-based classification
    for (const [intent, def] of Object.entries(INTENT_DEFINITIONS)) {
      if (def.keywords.length === 0) continue

      const matches = def.keywords.filter(k => lowerText.includes(k.toLowerCase()))
      if (matches.length >= 2) {
        const sentiment = this.detectSentiment(lowerText)
        return this.buildResult(intent as Intent, sentiment, 0.7)
      }
    }

    // Single keyword match with lower confidence
    for (const [intent, def] of Object.entries(INTENT_DEFINITIONS)) {
      if (def.keywords.length === 0) continue

      const matches = def.keywords.filter(k => lowerText.includes(k.toLowerCase()))
      if (matches.length >= 1) {
        const sentiment = this.detectSentiment(lowerText)
        return this.buildResult(intent as Intent, sentiment, 0.5)
      }
    }

    return this.buildResult('unknown', this.detectSentiment(lowerText), 0.3)
  }

  private buildResult(intent: Intent, sentiment: Sentiment, confidence: number): ClassificationResult {
    const intentDef = getIntentDefinition(intent)

    return {
      intent,
      intentCategory: intentDef.category,
      confidence,
      sentiment,
      sentimentScore: sentiment === 'positive' ? 0.5 : sentiment === 'negative' ? -0.5 : 0,
      entities: [],
      language: 'en',
      priority: calculatePriority(intent, sentiment, confidence),
      suggestedActions: [],
    }
  }

  private detectSentiment(text: string): Sentiment {
    const positive = ['thank', 'great', 'good', 'excellent', 'happy', 'love', 'awesome', 'amazing', 'wonderful', 'perfect']
    const negative = ['bad', 'terrible', 'awful', 'hate', 'angry', 'disappointed', 'frustrated', 'problem', 'issue', 'wrong', 'horrible']

    const posCount = positive.filter(w => text.includes(w)).length
    const negCount = negative.filter(w => text.includes(w)).length

    if (posCount > negCount) return 'positive'
    if (negCount > posCount) return 'negative'
    return 'neutral'
  }
}
