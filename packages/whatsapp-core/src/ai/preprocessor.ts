/**
 * Text Preprocessor for AI Classification
 *
 * Handles:
 * - Text cleaning and normalization
 * - Language detection
 * - Translation (if needed)
 * - Entity pre-extraction
 */

// Common greetings in different languages
const GREETINGS: Record<string, string> = {
  // English
  'hi': 'en', 'hello': 'en', 'hey': 'en',
  // Hindi
  'नमस्ते': 'hi', 'नमस्कार': 'hi', 'प्रणाम': 'hi',
  // Spanish
  'hola': 'es', 'buenos dias': 'es',
  // French
  'bonjour': 'fr', 'salut': 'fr',
  // Arabic
  'مرحبا': 'ar', 'السلام عليكم': 'ar',
  // Chinese
  '你好': 'zh', '您好': 'zh',
}

// Language patterns
const LANGUAGE_PATTERNS: Array<{ pattern: RegExp; lang: string }> = [
  { pattern: /[\u0900-\u097F]/, lang: 'hi' }, // Devanagari (Hindi)
  { pattern: /[\u0600-\u06FF]/, lang: 'ar' }, // Arabic
  { pattern: /[\u4E00-\u9FFF]/, lang: 'zh' }, // Chinese
  { pattern: /[\u3040-\u30FF]/, lang: 'ja' }, // Japanese
  { pattern: /[\uAC00-\uD7AF]/, lang: 'ko' }, // Korean
  { pattern: /[\u0980-\u09FF]/, lang: 'bn' }, // Bengali
  { pattern: /[\u0A80-\u0AFF]/, lang: 'gu' }, // Gujarati
  { pattern: /[\u0B00-\u0B7F]/, lang: 'or' }, // Oriya
  { pattern: /[\u0B80-\u0BFF]/, lang: 'ta' }, // Tamil
  { pattern: /[\u0C00-\u0C7F]/, lang: 'te' }, // Telugu
  { pattern: /[\u0C80-\u0CFF]/, lang: 'kn' }, // Kannada
  { pattern: /[\u0D00-\u0D7F]/, lang: 'ml' }, // Malayalam
  { pattern: /[\u0A00-\u0A7F]/, lang: 'pa' }, // Punjabi
]

export interface PreprocessedText {
  original: string
  cleaned: string
  language: string
  languageConfidence: number
  containsUrl: boolean
  containsPhone: boolean
  containsEmail: boolean
  wordCount: number
  extractedEntities: ExtractedEntity[]
}

export interface ExtractedEntity {
  type: 'phone' | 'email' | 'url' | 'date' | 'amount' | 'order_id' | 'name'
  value: string
  position: { start: number; end: number }
}

/**
 * Preprocess text for classification
 */
export function preprocessText(text: string): PreprocessedText {
  const original = text
  let cleaned = text

  // Extract entities before cleaning
  const extractedEntities = extractEntities(text)

  // Check for specific content
  const containsUrl = /https?:\/\/\S+/i.test(text)
  const containsPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)
  const containsEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)

  // Clean text
  cleaned = cleaned
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Replace URLs with placeholder
    .replace(/https?:\/\/\S+/g, '[URL]')
    // Remove most emojis but keep some meaningful ones
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Normalize dashes
    .replace(/[–—]/g, '-')
    // Remove excessive punctuation
    .replace(/([!?.]){2,}/g, '$1')
    // Trim
    .trim()

  // Detect language
  const { language, confidence } = detectLanguage(original)

  return {
    original,
    cleaned,
    language,
    languageConfidence: confidence,
    containsUrl,
    containsPhone,
    containsEmail,
    wordCount: cleaned.split(/\s+/).filter(w => w.length > 0).length,
    extractedEntities,
  }
}

/**
 * Detect language of text
 */
export function detectLanguage(text: string): { language: string; confidence: number } {
  // Check for non-Latin script patterns first
  for (const { pattern, lang } of LANGUAGE_PATTERNS) {
    if (pattern.test(text)) {
      const matches = text.match(pattern) || []
      const confidence = Math.min(matches.length / text.length * 10, 0.95)
      return { language: lang, confidence }
    }
  }

  // Check for known greetings
  const lowerText = text.toLowerCase().trim()
  for (const [greeting, lang] of Object.entries(GREETINGS)) {
    if (lowerText.startsWith(greeting)) {
      return { language: lang, confidence: 0.9 }
    }
  }

  // Default to English
  return { language: 'en', confidence: 0.7 }
}

/**
 * Extract entities from text
 */
export function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = []

  // Phone numbers
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
  let match
  while ((match = phonePattern.exec(text)) !== null) {
    entities.push({
      type: 'phone',
      value: match[0],
      position: { start: match.index, end: match.index + match[0].length },
    })
  }

  // Emails
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  while ((match = emailPattern.exec(text)) !== null) {
    entities.push({
      type: 'email',
      value: match[0],
      position: { start: match.index, end: match.index + match[0].length },
    })
  }

  // URLs
  const urlPattern = /https?:\/\/\S+/gi
  while ((match = urlPattern.exec(text)) !== null) {
    entities.push({
      type: 'url',
      value: match[0],
      position: { start: match.index, end: match.index + match[0].length },
    })
  }

  // Order IDs (common patterns)
  const orderPattern = /\b(order|ord|#|ref)[:\s#]*([A-Z0-9]{5,15})\b/gi
  while ((match = orderPattern.exec(text)) !== null) {
    entities.push({
      type: 'order_id',
      value: match[2],
      position: { start: match.index, end: match.index + match[0].length },
    })
  }

  // Currency amounts
  const amountPattern = /(?:Rs\.?|₹|INR|USD|\$|€|£)\s*[\d,]+(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:rs|rupees|dollars?|euros?)/gi
  while ((match = amountPattern.exec(text)) !== null) {
    entities.push({
      type: 'amount',
      value: match[0],
      position: { start: match.index, end: match.index + match[0].length },
    })
  }

  // Dates (various formats)
  const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*,?\s*\d{2,4}|\b(?:today|tomorrow|yesterday|next\s+(?:week|month))\b)/gi
  while ((match = datePattern.exec(text)) !== null) {
    entities.push({
      type: 'date',
      value: match[0],
      position: { start: match.index, end: match.index + match[0].length },
    })
  }

  return entities
}

/**
 * Normalize text for comparison
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if text is likely spam
 */
export function isLikelySpam(text: string): boolean {
  const spamIndicators = [
    /\b(lottery|winner|won|prize|claim|urgent|act now|limited time)\b/i,
    /\b(click here|subscribe|unsubscribe|opt-out)\b/i,
    /\b(viagra|casino|forex|crypto|bitcoin|invest)\b/i,
    /[A-Z]{10,}/, // Excessive caps
    /(.)\1{5,}/, // Repeated characters
    /https?:\/\/\S+.*https?:\/\/\S+/, // Multiple URLs
  ]

  return spamIndicators.some(pattern => pattern.test(text))
}
