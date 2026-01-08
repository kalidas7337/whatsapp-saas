/**
 * Intent Detector
 *
 * Detects user intent from incoming messages using keywords and patterns
 */

import { BotIncomingMessage, DetectedIntent, IntentPatternConfig } from './types'

// Keyword patterns for intent detection
const INTENT_PATTERNS: Record<string, IntentPatternConfig> = {
  greeting: {
    keywords: [
      'hi',
      'hello',
      'hey',
      'hola',
      'namaste',
      'good morning',
      'good afternoon',
      'good evening',
    ],
    patterns: [/^(hi|hello|hey)\b/i],
    priority: 10,
  },
  help: {
    keywords: [
      'help',
      'menu',
      'options',
      'what can you do',
      'commands',
      'start',
      'main menu',
    ],
    patterns: [/^\/?(help|menu|start)$/i],
    priority: 20,
  },
  human: {
    keywords: [
      'human',
      'agent',
      'talk to someone',
      'real person',
      'support',
      'customer service',
      'speak to agent',
    ],
    patterns: [/\b(human|agent|person)\b/i],
    priority: 30,
  },
  status: {
    keywords: [
      'status',
      'my status',
      'check status',
      'filing status',
      'itr status',
      'gst status',
      'application status',
    ],
    patterns: [/\b(status|check|track)\b.*\b(itr|gst|filing|return|application)\b/i],
    priority: 25,
  },
  payment: {
    keywords: [
      'pay',
      'payment',
      'invoice',
      'bill',
      'dues',
      'pending',
      'how much',
      'amount',
    ],
    patterns: [/\b(pay|payment|invoice|bill|dues|amount|pending)\b/i],
    priority: 25,
  },
  document: {
    keywords: [
      'document',
      'documents',
      'upload',
      'send document',
      'file',
      'pan',
      'aadhaar',
      'form 16',
    ],
    patterns: [/\b(document|upload|send|pan|aadhaar|form.?16)\b/i],
    priority: 20,
  },
  thanks: {
    keywords: ['thank', 'thanks', 'thank you', 'thx', 'appreciate'],
    patterns: [/\b(thank|thanks|thx)\b/i],
    priority: 5,
  },
  bye: {
    keywords: ['bye', 'goodbye', 'see you', 'later', 'exit', 'quit'],
    patterns: [/\b(bye|goodbye|exit|quit)\b/i],
    priority: 5,
  },
  yes: {
    keywords: [
      'yes',
      'yeah',
      'yep',
      'sure',
      'ok',
      'okay',
      'correct',
      'right',
      'confirm',
    ],
    patterns: [/^(yes|yeah|yep|sure|ok|okay|y)$/i],
    priority: 15,
  },
  no: {
    keywords: ['no', 'nope', 'nah', 'cancel', 'wrong', 'incorrect'],
    patterns: [/^(no|nope|nah|n|cancel)$/i],
    priority: 15,
  },
}

/**
 * Detect intent from incoming message
 */
export function detectIntent(message: BotIncomingMessage): DetectedIntent {
  // Handle interactive responses directly
  if (message.type === 'interactive' || message.type === 'button') {
    return detectIntentFromInteractive(message)
  }

  // Handle text messages
  if (message.text) {
    return detectIntentFromText(message.text)
  }

  // Handle media messages
  if (message.type === 'image' || message.type === 'document') {
    return {
      name: 'document_upload',
      confidence: 0.9,
      entities: { mediaType: message.type, mediaId: message.mediaId },
      rawInput: message.caption || '',
    }
  }

  // Handle location
  if (message.type === 'location') {
    return {
      name: 'location_shared',
      confidence: 0.9,
      entities: { latitude: message.latitude, longitude: message.longitude },
      rawInput: '',
    }
  }

  // Fallback
  return {
    name: 'unknown',
    confidence: 0.1,
    entities: {},
    rawInput: message.text || '',
  }
}

/**
 * Detect intent from text input
 */
function detectIntentFromText(text: string): DetectedIntent {
  const normalizedText = text.toLowerCase().trim()

  let bestMatch: { name: string; confidence: number; priority: number } | null =
    null

  for (const [intentName, config] of Object.entries(INTENT_PATTERNS)) {
    // Check exact keyword matches
    for (const keyword of config.keywords) {
      if (
        normalizedText === keyword ||
        normalizedText.includes(keyword)
      ) {
        const confidence = normalizedText === keyword ? 1.0 : 0.8

        if (
          !bestMatch ||
          confidence > bestMatch.confidence ||
          (confidence === bestMatch.confidence &&
            config.priority > bestMatch.priority)
        ) {
          bestMatch = { name: intentName, confidence, priority: config.priority }
        }
      }
    }

    // Check regex patterns
    if (config.patterns) {
      for (const pattern of config.patterns) {
        if (pattern.test(normalizedText)) {
          const confidence = 0.9

          if (
            !bestMatch ||
            confidence > bestMatch.confidence ||
            (confidence === bestMatch.confidence &&
              config.priority > bestMatch.priority)
          ) {
            bestMatch = { name: intentName, confidence, priority: config.priority }
          }
        }
      }
    }
  }

  if (bestMatch) {
    return {
      name: bestMatch.name,
      confidence: bestMatch.confidence,
      entities: extractEntities(normalizedText, bestMatch.name),
      rawInput: text,
    }
  }

  // Fallback to unknown
  return {
    name: 'unknown',
    confidence: 0.1,
    entities: {},
    rawInput: text,
  }
}

/**
 * Detect intent from interactive response
 */
function detectIntentFromInteractive(
  message: BotIncomingMessage
): DetectedIntent {
  const buttonId = message.buttonId || message.listId || ''
  const title = message.buttonTitle || message.listTitle || ''

  // Button IDs often contain intent hints
  // e.g., "menu_help", "action_pay", "confirm_yes"
  const idParts = buttonId.toLowerCase().split('_')

  // Map common button prefixes to intents
  const buttonIntentMap: Record<string, string> = {
    help: 'help',
    menu: 'help',
    pay: 'payment',
    status: 'status',
    human: 'human',
    agent: 'human',
    yes: 'yes',
    no: 'no',
    confirm: 'yes',
    cancel: 'no',
    back: 'help',
    document: 'document',
    service: 'help',
  }

  for (const part of idParts) {
    if (buttonIntentMap[part]) {
      return {
        name: buttonIntentMap[part],
        confidence: 1.0,
        entities: { buttonId, buttonTitle: title },
        rawInput: title,
      }
    }
  }

  // Return button response as a specific intent
  return {
    name: 'button_response',
    confidence: 1.0,
    entities: { buttonId, buttonTitle: title },
    rawInput: title,
  }
}

/**
 * Extract entities from text based on intent
 */
function extractEntities(
  text: string,
  intent: string
): Record<string, unknown> {
  const entities: Record<string, unknown> = {}

  switch (intent) {
    case 'status':
      // Extract what status they're asking about
      if (/itr/i.test(text)) entities.statusType = 'ITR'
      if (/gst/i.test(text)) entities.statusType = 'GST'
      if (/tds/i.test(text)) entities.statusType = 'TDS'
      break

    case 'payment':
      // Extract payment-related entities
      const amountMatch = text.match(/₹?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i)
      if (amountMatch) {
        entities.amount = parseFloat(amountMatch[1].replace(/,/g, ''))
      }
      break
  }

  return entities
}

/**
 * Check if message matches a specific trigger keyword
 */
export function matchesTriggerKeywords(
  text: string,
  keywords: string[]
): boolean {
  const normalizedText = text.toLowerCase().trim()

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase().trim()

    // Exact match
    if (normalizedText === normalizedKeyword) return true

    // Word boundary match
    const wordPattern = new RegExp(
      `\\b${escapeRegex(normalizedKeyword)}\\b`,
      'i'
    )
    if (wordPattern.test(normalizedText)) return true
  }

  return false
}

/**
 * Check if message matches a regex pattern
 */
export function matchesPattern(text: string, pattern: string): boolean {
  try {
    const regex = new RegExp(pattern, 'i')
    return regex.test(text)
  } catch {
    return false
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Register custom intent pattern
 */
export function registerIntentPattern(
  intentName: string,
  config: IntentPatternConfig
): void {
  INTENT_PATTERNS[intentName] = config
}

/**
 * Get all registered intent patterns
 */
export function getIntentPatterns(): Record<string, IntentPatternConfig> {
  return { ...INTENT_PATTERNS }
}
