/**
 * Bot Engine Module
 *
 * Exports all bot-related functionality
 */

// Types
export * from './types'

// Bot Engine
export { BotEngine, createBotEngine, type BotEngineConfig } from './bot-engine'

// Intent Detection
export {
  detectIntent,
  matchesTriggerKeywords,
  matchesPattern,
  registerIntentPattern,
  getIntentPatterns,
} from './intent-detector'

// Context Management
export {
  createDefaultContext,
  parseContext,
  serializeContext,
  updateContext,
  addIntentToHistory,
  addResponseToHistory,
  startFlow,
  clearFlow,
  setVariable,
  getVariable,
  interpolateVariables,
  isInActiveFlow,
  isAwaitingInput,
  isFlowTimedOut,
  hasVariable,
  deleteVariable,
  clearVariables,
  getIdleTime,
  isConversationIdle,
} from './context-manager'

// Intent Handlers
export {
  getIntentHandler,
  registerIntentHandler,
  hasIntentHandler,
  getRegisteredIntents,
  greetingHandler,
  helpHandler,
  humanHandler,
  fallbackHandler,
  statusHandler,
  thanksHandler,
  byeHandler,
} from './intents'

// Response Builder
export {
  buildMessagePayload,
  textResponse,
  buttonResponse,
  listResponse,
  templateResponse,
  imageResponse,
  documentResponse,
  withDelay,
  quickReplies,
  type MessagePayload,
} from './response-builder'
