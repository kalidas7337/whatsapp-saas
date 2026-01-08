/**
 * Intent Registry
 *
 * Exports all intent handlers and provides registration mechanism
 */

import { IntentHandler } from '../types'
import { greetingHandler } from './greeting.intent'
import { helpHandler } from './help.intent'
import { humanHandler } from './human.intent'
import { fallbackHandler } from './fallback.intent'
import { statusHandler } from './status.intent'
import { thanksHandler, byeHandler } from './thanks.intent'

// Intent handler registry
const intentHandlers: Record<string, IntentHandler> = {
  greeting: greetingHandler,
  help: helpHandler,
  human: humanHandler,
  status: statusHandler,
  thanks: thanksHandler,
  bye: byeHandler,
  payment: helpHandler, // Redirect to help for now
  document: helpHandler, // Redirect to help for now
  yes: helpHandler, // Context-dependent, default to help
  no: helpHandler, // Context-dependent, default to help
  button_response: helpHandler, // Default for unhandled buttons
  document_upload: fallbackHandler, // Handle media uploads
  location_shared: fallbackHandler, // Handle location shares
  // Fallback for unknown intents
  unknown: fallbackHandler,
}

/**
 * Get handler for intent
 */
export function getIntentHandler(intentName: string): IntentHandler {
  return intentHandlers[intentName] || intentHandlers.unknown
}

/**
 * Register custom intent handler
 */
export function registerIntentHandler(
  intentName: string,
  handler: IntentHandler
): void {
  intentHandlers[intentName] = handler
}

/**
 * Check if handler exists for intent
 */
export function hasIntentHandler(intentName: string): boolean {
  return intentName in intentHandlers
}

/**
 * Get all registered intent names
 */
export function getRegisteredIntents(): string[] {
  return Object.keys(intentHandlers)
}

// Export individual handlers
export {
  greetingHandler,
  helpHandler,
  humanHandler,
  fallbackHandler,
  statusHandler,
  thanksHandler,
  byeHandler,
}
