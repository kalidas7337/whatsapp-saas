import {
  AIProvider,
  ClassificationRequest,
  ClassificationResult,
  ResponseSuggestion,
  Intent,
  Sentiment,
  Entity,
  CannedResponse,
  SuggestedAction,
} from '../types'
import { getIntentDefinition, calculatePriority, INTENT_DEFINITIONS } from '../intents'

const CLASSIFICATION_PROMPT = `You are an AI assistant that classifies customer messages for a business WhatsApp platform.

Analyze the following message and provide:
1. Intent - The primary purpose of the message
2. Sentiment - The emotional tone (positive, negative, neutral)
3. Entities - Key information extracted (dates, amounts, names, order IDs, etc.)
4. Language - The language of the message (ISO 639-1 code)

Available intents:
${Object.entries(INTENT_DEFINITIONS).map(([intent, def]) => `- ${intent}: ${def.description}`).join('\n')}

Respond in JSON format only:
{
  "intent": "string (one of the available intents)",
  "confidence": number (0.0-1.0),
  "sentiment": "positive" | "negative" | "neutral",
  "sentimentScore": number (-1.0 to 1.0, negative=-1, positive=1),
  "entities": [{"type": "string", "value": "string", "confidence": number}],
  "language": "string (ISO 639-1 code like en, hi, es)",
  "reasoning": "brief explanation of classification"
}`

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string | null
    }
  }>
}

export class OpenAIProvider implements AIProvider {
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor(apiKey: string, model = 'gpt-4-turbo-preview', baseUrl = 'https://api.openai.com/v1') {
    this.apiKey = apiKey
    this.model = model
    this.baseUrl = baseUrl
  }

  async classify(request: ClassificationRequest): Promise<ClassificationResult> {
    const context = request.previousMessages?.length
      ? `Previous messages in conversation:\n${request.previousMessages.slice(-3).join('\n')}\n\n`
      : ''

    const messages: OpenAIMessage[] = [
      { role: 'system', content: CLASSIFICATION_PROMPT },
      { role: 'user', content: `${context}Current message to classify: "${request.text}"` },
    ]

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenAI API error: ${response.status} - ${error}`)
      }

      const data = await response.json() as OpenAIResponse
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('Empty response from OpenAI')
      }

      const result = JSON.parse(content)
      return this.parseClassificationResult(result)
    } catch (error) {
      console.error('OpenAI classification error:', error)
      // Return fallback result
      return this.getFallbackResult()
    }
  }

  async suggestResponses(
    intent: Intent,
    context: string,
    responses: CannedResponse[]
  ): Promise<ResponseSuggestion[]> {
    if (responses.length === 0) return []

    const prompt = `Given this customer message context and intent, rank these canned responses by relevance.

Intent: ${intent}
Customer message: "${context}"

Available responses:
${responses.map((r, i) => `${i + 1}. [${r.category}] ${r.text}`).join('\n')}

Return a JSON object with a "suggestions" array containing the top 3 most relevant responses:
{"suggestions": [{"index": 1, "score": 0.95, "reason": "why this matches"}]}`

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 300,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json() as OpenAIResponse
      const content = data.choices[0]?.message?.content

      if (!content) return []

      const result = JSON.parse(content)
      const suggestions = result.suggestions || result

      return (Array.isArray(suggestions) ? suggestions : [])
        .map((s: { index: number; score: number }) => {
          const original = responses[s.index - 1]
          if (!original) return null
          return {
            id: original.id,
            text: original.text,
            category: original.category,
            matchScore: s.score || 0.5,
          }
        })
        .filter((s): s is ResponseSuggestion => s !== null)
        .slice(0, 3)
    } catch (error) {
      console.error('OpenAI suggestion error:', error)
      return []
    }
  }

  private parseClassificationResult(result: Record<string, unknown>): ClassificationResult {
    const intent = (result.intent as Intent) || 'unknown'
    const intentDef = getIntentDefinition(intent)
    const sentiment = (result.sentiment as Sentiment) || 'neutral'
    const confidence = typeof result.confidence === 'number' ? result.confidence : 0.5

    const entities: Entity[] = Array.isArray(result.entities)
      ? result.entities.map((e: Record<string, unknown>) => ({
          type: String(e.type || 'unknown'),
          value: String(e.value || ''),
          confidence: typeof e.confidence === 'number' ? e.confidence : 0.8,
        }))
      : []

    return {
      intent,
      intentCategory: intentDef.category,
      confidence,
      sentiment,
      sentimentScore: typeof result.sentimentScore === 'number' ? result.sentimentScore : 0,
      entities,
      language: String(result.language || 'en'),
      priority: calculatePriority(intent, sentiment, confidence),
      suggestedActions: this.buildSuggestedActions(intent, intentDef),
      rawResponse: result,
    }
  }

  private buildSuggestedActions(intent: Intent, intentDef: { autoRoute?: string; triggerBot?: string }): SuggestedAction[] {
    const actions: SuggestedAction[] = []

    if (intentDef.autoRoute) {
      actions.push({
        type: 'route',
        data: { team: intentDef.autoRoute },
        confidence: 0.9,
      })
    }

    if (intentDef.triggerBot) {
      actions.push({
        type: 'bot_flow',
        data: { flowId: intentDef.triggerBot },
        confidence: 0.85,
      })
    }

    // Tag suggestion
    actions.push({
      type: 'tag',
      data: { tags: [intent, intentDef.autoRoute || 'general'].filter(Boolean) },
      confidence: 0.95,
    })

    return actions
  }

  private getFallbackResult(): ClassificationResult {
    return {
      intent: 'unknown',
      intentCategory: 'other',
      confidence: 0.3,
      sentiment: 'neutral',
      sentimentScore: 0,
      entities: [],
      language: 'en',
      priority: 'medium',
      suggestedActions: [],
    }
  }
}
