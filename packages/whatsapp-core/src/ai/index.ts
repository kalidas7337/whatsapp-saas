// Types
export * from './types'

// Intent definitions
export * from './intents'

// Classifier
export { AIClassifier, createClassifier } from './classifier'

// Providers
export { OpenAIProvider } from './providers/openai.provider'
export { OllamaProvider } from './providers/ollama.provider'

// Preprocessor
export {
  preprocessText,
  detectLanguage,
  extractEntities,
  normalizeText,
  isLikelySpam,
  type PreprocessedText,
  type ExtractedEntity,
} from './preprocessor'
