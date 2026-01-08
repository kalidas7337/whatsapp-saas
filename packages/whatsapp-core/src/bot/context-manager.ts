/**
 * Context Manager
 *
 * Manages conversation context and state
 */

import { ConversationContext } from './types'

/**
 * Default conversation context
 */
export function createDefaultContext(): ConversationContext {
  return {
    variables: {},
    lastIntents: [],
    lastResponses: [],
    lastInteractionAt: Date.now(),
    language: 'en',
    timezone: 'Asia/Kolkata',
  }
}

/**
 * Parse context from JSON (stored in database)
 */
export function parseContext(json: unknown): ConversationContext {
  if (!json || typeof json !== 'object') {
    return createDefaultContext()
  }

  const data = json as Record<string, unknown>

  return {
    currentFlowId: data.currentFlowId as string | undefined,
    currentNodeId: data.currentNodeId as string | undefined,
    awaitingInput: (data.awaitingInput as boolean) ?? false,
    awaitingInputType: data.awaitingInputType as
      | 'text'
      | 'button'
      | 'list'
      | 'any'
      | undefined,
    variables: (data.variables as Record<string, unknown>) ?? {},
    lastIntents: (data.lastIntents as string[]) ?? [],
    lastResponses: (data.lastResponses as string[]) ?? [],
    flowStartedAt: data.flowStartedAt as number | undefined,
    lastInteractionAt: (data.lastInteractionAt as number) ?? Date.now(),
    language: (data.language as string) ?? 'en',
    timezone: (data.timezone as string) ?? 'Asia/Kolkata',
  }
}

/**
 * Serialize context to JSON for storage
 */
export function serializeContext(
  context: ConversationContext
): Record<string, unknown> {
  return {
    ...context,
    lastInteractionAt: Date.now(),
    // Trim history to prevent bloat
    lastIntents: context.lastIntents.slice(-10),
    lastResponses: context.lastResponses.slice(-10),
  }
}

/**
 * Update context with new values
 */
export function updateContext(
  current: ConversationContext,
  updates: Partial<ConversationContext>
): ConversationContext {
  return {
    ...current,
    ...updates,
    variables: {
      ...current.variables,
      ...(updates.variables || {}),
    },
    lastInteractionAt: Date.now(),
  }
}

/**
 * Add intent to history
 */
export function addIntentToHistory(
  context: ConversationContext,
  intent: string
): ConversationContext {
  return {
    ...context,
    lastIntents: [...context.lastIntents.slice(-9), intent],
    lastInteractionAt: Date.now(),
  }
}

/**
 * Add response to history
 */
export function addResponseToHistory(
  context: ConversationContext,
  response: string
): ConversationContext {
  return {
    ...context,
    lastResponses: [...context.lastResponses.slice(-9), response],
  }
}

/**
 * Start a new flow
 */
export function startFlow(
  context: ConversationContext,
  flowId: string,
  startNodeId: string
): ConversationContext {
  return {
    ...context,
    currentFlowId: flowId,
    currentNodeId: startNodeId,
    flowStartedAt: Date.now(),
    awaitingInput: false,
  }
}

/**
 * Clear current flow
 */
export function clearFlow(context: ConversationContext): ConversationContext {
  return {
    ...context,
    currentFlowId: undefined,
    currentNodeId: undefined,
    flowStartedAt: undefined,
    awaitingInput: false,
    awaitingInputType: undefined,
  }
}

/**
 * Set variable in context
 */
export function setVariable(
  context: ConversationContext,
  name: string,
  value: unknown
): ConversationContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      [name]: value,
    },
  }
}

/**
 * Get variable from context
 */
export function getVariable(
  context: ConversationContext,
  name: string,
  defaultValue?: unknown
): unknown {
  return context.variables[name] ?? defaultValue
}

/**
 * Interpolate variables in text
 * Supports: {{variable}}, {{contact.name}}, {{context.someVar}}
 */
export function interpolateVariables(
  text: string,
  context: ConversationContext,
  contact: { name?: string; phone: string; [key: string]: unknown }
): string {
  return text.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (match, path: string) => {
    const parts = path.split('.')

    if (parts[0] === 'contact') {
      const value = contact[parts[1]]
      return value !== undefined ? String(value) : match
    }

    if (parts[0] === 'context' || parts[0] === 'var') {
      const value = context.variables[parts[1]]
      return value !== undefined ? String(value) : match
    }

    // Direct variable reference
    const directValue =
      context.variables[parts[0]] ?? contact[parts[0]]
    return directValue !== undefined ? String(directValue) : match
  })
}

/**
 * Check if conversation is in active flow
 */
export function isInActiveFlow(context: ConversationContext): boolean {
  return !!context.currentFlowId && !!context.currentNodeId
}

/**
 * Check if conversation is awaiting input
 */
export function isAwaitingInput(context: ConversationContext): boolean {
  return context.awaitingInput === true
}

/**
 * Get flow timeout (default 30 minutes)
 */
export function isFlowTimedOut(
  context: ConversationContext,
  timeoutMs: number = 30 * 60 * 1000
): boolean {
  if (!context.flowStartedAt) return false
  return Date.now() - context.flowStartedAt > timeoutMs
}

/**
 * Check if context has a specific variable set
 */
export function hasVariable(
  context: ConversationContext,
  name: string
): boolean {
  return name in context.variables
}

/**
 * Delete a variable from context
 */
export function deleteVariable(
  context: ConversationContext,
  name: string
): ConversationContext {
  const { [name]: _, ...remaining } = context.variables
  return {
    ...context,
    variables: remaining,
  }
}

/**
 * Clear all variables in context
 */
export function clearVariables(
  context: ConversationContext
): ConversationContext {
  return {
    ...context,
    variables: {},
  }
}

/**
 * Get time since last interaction
 */
export function getIdleTime(context: ConversationContext): number {
  return Date.now() - context.lastInteractionAt
}

/**
 * Check if conversation is idle (default 5 minutes)
 */
export function isConversationIdle(
  context: ConversationContext,
  idleThresholdMs: number = 5 * 60 * 1000
): boolean {
  return getIdleTime(context) > idleThresholdMs
}
