/**
 * Bot Engine
 *
 * Main bot engine that processes incoming messages and generates responses.
 * Supports intent detection, flow execution, and context management.
 */

import {
  BotIncomingMessage,
  BotResponse,
  BotResponseMessage,
  ConversationContext,
  ChatbotFlow,
  FlowNode,
  BotAction,
} from './types'
import { detectIntent } from './intent-detector'
import { getIntentHandler } from './intents'
import {
  updateContext,
  addIntentToHistory,
  isInActiveFlow,
  isAwaitingInput,
  isFlowTimedOut,
  clearFlow,
} from './context-manager'

export interface BotEngineConfig {
  // Function to fetch active flows for organization
  fetchFlows: (organizationId: string) => Promise<ChatbotFlow[]>

  // Function to get PMS data (for integrated mode)
  getPmsData?: (clientId: string, dataType: string) => Promise<unknown>

  // Default language
  defaultLanguage?: string

  // Flow timeout in milliseconds
  flowTimeout?: number

  // Enable debug logging
  debug?: boolean
}

interface FlowCache {
  flows: ChatbotFlow[]
  cachedAt: number
}

/**
 * Main Bot Engine
 *
 * Processes incoming messages and generates appropriate responses.
 */
export class BotEngine {
  private config: BotEngineConfig
  private flowCache: Map<string, FlowCache> = new Map()
  private flowCacheTTL = 60000 // 1 minute

  constructor(config: BotEngineConfig) {
    this.config = {
      defaultLanguage: 'en',
      flowTimeout: 30 * 60 * 1000, // 30 minutes
      debug: false,
      ...config,
    }
  }

  /**
   * Process incoming message and generate response
   */
  async processMessage(message: BotIncomingMessage): Promise<BotResponse> {
    const startTime = Date.now()

    try {
      this.debug('Processing message:', {
        messageId: message.id,
        type: message.type,
        text: message.text?.substring(0, 50),
        mode: message.mode,
      })

      // 1. Check if in active flow
      if (isInActiveFlow(message.context)) {
        // Check for timeout
        if (isFlowTimedOut(message.context, this.config.flowTimeout)) {
          this.debug('Flow timed out, clearing')
          message.context = clearFlow(message.context)
        } else {
          // Continue flow execution
          const flowResponse = await this.continueFlow(message)
          if (flowResponse) {
            return flowResponse
          }
          // If flow didn't handle it, fall through to intent detection
        }
      }

      // 2. Detect intent
      const intent = detectIntent(message)
      this.debug('Detected intent:', intent)

      // 3. Check for flow triggers
      const flows = await this.getActiveFlows(message.organizationId)
      const matchingFlow = this.findMatchingFlow(flows, message, intent)

      if (matchingFlow) {
        this.debug('Starting flow:', matchingFlow.name)
        return this.executeFlow(matchingFlow, message)
      }

      // 4. Handle with intent handler
      const handler = getIntentHandler(intent.name)
      const response = await handler(message, message.context)

      // 5. Update context with intent
      response.contextUpdates = {
        ...response.contextUpdates,
        ...addIntentToHistory(message.context, intent.name),
      }

      this.debug('Response generated:', {
        messages: response.messages.length,
        transferToHuman: response.transferToHuman,
        duration: Date.now() - startTime,
      })

      return response
    } catch (error) {
      console.error('[BOT_ENGINE] Error processing message:', error)

      // Return fallback response
      return {
        messages: [
          {
            type: 'text',
            text: "I'm sorry, I encountered an error. Please try again or type 'help' for options.",
          },
        ],
        contextUpdates: {},
        actions: [],
        transferToHuman: false,
      }
    }
  }

  /**
   * Get active flows for organization (cached)
   */
  private async getActiveFlows(organizationId: string): Promise<ChatbotFlow[]> {
    const cached = this.flowCache.get(organizationId)

    if (cached && Date.now() - cached.cachedAt < this.flowCacheTTL) {
      return cached.flows
    }

    const flows = await this.config.fetchFlows(organizationId)

    this.flowCache.set(organizationId, {
      flows,
      cachedAt: Date.now(),
    })

    return flows
  }

  /**
   * Find flow that matches the message
   */
  private findMatchingFlow(
    flows: ChatbotFlow[],
    message: BotIncomingMessage,
    intent: { name: string; entities: Record<string, unknown> }
  ): ChatbotFlow | null {
    // Sort by priority (higher first)
    const sortedFlows = [...flows].sort((a, b) => b.priority - a.priority)

    for (const flow of sortedFlows) {
      if (!flow.isActive) continue

      switch (flow.triggerType) {
        case 'KEYWORD':
          if (
            message.text &&
            this.matchesKeywords(message.text, flow.triggerKeywords)
          ) {
            return flow
          }
          break

        case 'FIRST_MESSAGE':
          // Check if this is the first message (no previous intents)
          if (message.context.lastIntents.length === 0) {
            return flow
          }
          break

        case 'BUTTON_REPLY':
          if (
            message.buttonId &&
            flow.triggerKeywords.includes(message.buttonId)
          ) {
            return flow
          }
          break

        case 'LIST_REPLY':
          if (message.listId && flow.triggerKeywords.includes(message.listId)) {
            return flow
          }
          break

        case 'REGEX_PATTERN':
          if (message.text && flow.triggerPattern) {
            try {
              const regex = new RegExp(flow.triggerPattern, 'i')
              if (regex.test(message.text)) {
                return flow
              }
            } catch {
              /* Invalid regex, skip */
            }
          }
          break

        case 'ALL_MESSAGES':
          // Catch-all, but only if no other intent matched well
          if (intent.name === 'unknown') {
            return flow
          }
          break
      }
    }

    return null
  }

  /**
   * Check if text matches any keywords
   */
  private matchesKeywords(text: string, keywords: string[]): boolean {
    const normalizedText = text.toLowerCase().trim()

    return keywords.some((keyword) => {
      const normalizedKeyword = keyword.toLowerCase().trim()
      return (
        normalizedText === normalizedKeyword ||
        normalizedText.includes(normalizedKeyword)
      )
    })
  }

  /**
   * Execute a chatbot flow
   */
  private async executeFlow(
    flow: ChatbotFlow,
    message: BotIncomingMessage
  ): Promise<BotResponse> {
    // Start at the beginning of the flow
    const startNodeId = flow.flowDefinition.startNodeId
    const startNode = flow.flowDefinition.nodes.find(
      (n) => n.id === startNodeId
    )

    if (!startNode) {
      console.error('[BOT_ENGINE] Flow has no start node:', flow.id)
      return this.fallbackResponse(message)
    }

    // Update context to track flow
    const updatedContext: ConversationContext = {
      ...message.context,
      currentFlowId: flow.id,
      currentNodeId: startNodeId,
      flowStartedAt: Date.now(),
    }

    // Execute the node
    return this.executeNode(flow, startNode, message, updatedContext)
  }

  /**
   * Continue an active flow
   */
  private async continueFlow(
    message: BotIncomingMessage
  ): Promise<BotResponse | null> {
    const { currentFlowId, currentNodeId } = message.context

    if (!currentFlowId || !currentNodeId) {
      return null
    }

    const flows = await this.getActiveFlows(message.organizationId)
    const flow = flows.find((f) => f.id === currentFlowId)

    if (!flow) {
      // Flow no longer exists, clear context
      message.context = clearFlow(message.context)
      return null
    }

    const currentNode = flow.flowDefinition.nodes.find(
      (n) => n.id === currentNodeId
    )

    if (!currentNode) {
      message.context = clearFlow(message.context)
      return null
    }

    // If awaiting input, process the response
    if (isAwaitingInput(message.context)) {
      return this.processFlowInput(flow, currentNode, message)
    }

    // Otherwise, continue to next node
    const nextNodeId = this.getNextNodeId(flow, currentNode, message)

    if (!nextNodeId) {
      // End of flow
      return {
        messages: [],
        contextUpdates: clearFlow(message.context),
        actions: [],
        transferToHuman: false,
      }
    }

    const nextNode = flow.flowDefinition.nodes.find((n) => n.id === nextNodeId)

    if (!nextNode) {
      message.context = clearFlow(message.context)
      return null
    }

    return this.executeNode(flow, nextNode, message, {
      ...message.context,
      currentNodeId: nextNodeId,
    })
  }

  /**
   * Execute a flow node
   */
  private async executeNode(
    flow: ChatbotFlow,
    node: FlowNode,
    message: BotIncomingMessage,
    context: ConversationContext
  ): Promise<BotResponse> {
    this.debug('Executing node:', {
      flowId: flow.id,
      nodeId: node.id,
      nodeType: node.type,
    })

    const response: BotResponse = {
      messages: [],
      contextUpdates: context,
      actions: [],
      transferToHuman: false,
    }

    switch (node.type) {
      case 'SEND_MESSAGE':
        response.messages.push({
          type: 'text',
          text: this.interpolate(node.data.text as string, context, message),
        })
        break

      case 'SEND_BUTTONS':
        response.messages.push({
          type: 'interactive',
          interactive: {
            type: 'button',
            header: node.data.header
              ? this.interpolate(node.data.header as string, context, message)
              : undefined,
            body: this.interpolate(node.data.body as string, context, message),
            footer: node.data.footer as string | undefined,
            buttons: node.data.buttons as Array<{ id: string; title: string }>,
          },
        })
        break

      case 'SEND_LIST':
        response.messages.push({
          type: 'interactive',
          interactive: {
            type: 'list',
            body: this.interpolate(node.data.body as string, context, message),
            buttonText: (node.data.buttonText as string) || 'Select',
            sections: node.data.sections as Array<{
              title?: string
              rows: Array<{ id: string; title: string; description?: string }>
            }>,
          },
        })
        break

      case 'ASK_QUESTION':
        response.messages.push({
          type: 'text',
          text: this.interpolate(
            node.data.question as string,
            context,
            message
          ),
        })
        response.contextUpdates = {
          ...response.contextUpdates,
          awaitingInput: true,
          awaitingInputType:
            (node.data.inputType as 'text' | 'button' | 'list' | 'any') || 'any',
        }
        break

      case 'SET_VARIABLE':
        response.contextUpdates = {
          ...response.contextUpdates,
          variables: {
            ...context.variables,
            [node.data.variableName as string]: this.evaluateValue(
              node.data.value,
              context,
              message
            ),
          },
        }
        break

      case 'ASSIGN_AGENT':
        response.messages.push({
          type: 'text',
          text:
            (node.data.message as string) ||
            "I'm connecting you with our team. Please wait a moment.",
        })
        response.transferToHuman = true
        response.transferReason =
          (node.data.reason as string) || 'Flow assigned to agent'
        break

      case 'ADD_TAG':
        response.actions.push({
          type: 'add_tag',
          payload: { tag: node.data.tag },
        })
        break

      case 'REMOVE_TAG':
        response.actions.push({
          type: 'remove_tag',
          payload: { tag: node.data.tag },
        })
        break

      case 'DELAY':
        // Add delay to last message
        if (response.messages.length > 0) {
          response.messages[response.messages.length - 1].delay =
            (node.data.delayMs as number) || 1000
        }
        break

      case 'END':
        response.contextUpdates = clearFlow(context)
        if (node.data.message) {
          response.messages.push({
            type: 'text',
            text: this.interpolate(
              node.data.message as string,
              context,
              message
            ),
          })
        }
        break

      default:
        this.debug('Unknown node type:', node.type)
    }

    // If not awaiting input and not end, get next node
    if (
      !response.contextUpdates.awaitingInput &&
      node.type !== 'END' &&
      !response.transferToHuman
    ) {
      const nextNodeId = this.getNextNodeId(flow, node, message)

      if (nextNodeId) {
        const nextNode = flow.flowDefinition.nodes.find(
          (n) => n.id === nextNodeId
        )
        if (nextNode) {
          // Chain to next node - merge context updates with base context
          const mergedContext: ConversationContext = {
            ...context,
            ...response.contextUpdates,
            variables: {
              ...context.variables,
              ...(response.contextUpdates.variables || {}),
            },
            currentNodeId: nextNodeId,
          }
          const nextResponse = await this.executeNode(flow, nextNode, message, mergedContext)

          response.messages.push(...nextResponse.messages)
          response.contextUpdates = nextResponse.contextUpdates
          response.actions.push(...nextResponse.actions)
          response.transferToHuman =
            nextResponse.transferToHuman || response.transferToHuman
        }
      } else {
        // No next node, end flow
        response.contextUpdates = clearFlow(context)
      }
    }

    return response
  }

  /**
   * Process user input in flow
   */
  private async processFlowInput(
    flow: ChatbotFlow,
    currentNode: FlowNode,
    message: BotIncomingMessage
  ): Promise<BotResponse> {
    // Store the input in context
    const variableName =
      (currentNode.data.variableName as string) || 'lastInput'
    const inputValue = message.text || message.buttonId || message.listId || ''

    const updatedContext: ConversationContext = {
      ...message.context,
      awaitingInput: false,
      awaitingInputType: undefined,
      variables: {
        ...message.context.variables,
        [variableName]: inputValue,
      },
    }

    // Get next node
    const nextNodeId = this.getNextNodeId(flow, currentNode, message)

    if (!nextNodeId) {
      return {
        messages: [],
        contextUpdates: clearFlow(updatedContext),
        actions: [],
        transferToHuman: false,
      }
    }

    const nextNode = flow.flowDefinition.nodes.find((n) => n.id === nextNodeId)

    if (!nextNode) {
      return {
        messages: [],
        contextUpdates: clearFlow(updatedContext),
        actions: [],
        transferToHuman: false,
      }
    }

    return this.executeNode(flow, nextNode, message, {
      ...updatedContext,
      currentNodeId: nextNodeId,
    })
  }

  /**
   * Get next node ID based on edges
   */
  private getNextNodeId(
    flow: ChatbotFlow,
    currentNode: FlowNode,
    message: BotIncomingMessage
  ): string | null {
    const edges = flow.flowDefinition.edges.filter(
      (e) => e.source === currentNode.id
    )

    if (edges.length === 0) {
      return null
    }

    // If only one edge, use it
    if (edges.length === 1) {
      return edges[0].target
    }

    // Multiple edges - evaluate conditions
    for (const edge of edges) {
      if (edge.condition) {
        if (this.evaluateCondition(edge.condition, message.context, message)) {
          return edge.target
        }
      }
    }

    // Default to first edge without condition
    const defaultEdge = edges.find((e) => !e.condition)
    return defaultEdge?.target || null
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(
    condition: string,
    context: ConversationContext,
    message: BotIncomingMessage
  ): boolean {
    try {
      // Simple condition evaluation
      // Supports: variable == value, variable != value, variable contains value
      const match = condition.match(/(\w+)\s*(==|!=|contains)\s*(.+)/)

      if (!match) return false

      const [, variable, operator, value] = match
      const actualValue = context.variables[variable] || message.text || ''
      const expectedValue = value.trim().replace(/^["']|["']$/g, '')

      switch (operator) {
        case '==':
          return (
            String(actualValue).toLowerCase() === expectedValue.toLowerCase()
          )
        case '!=':
          return (
            String(actualValue).toLowerCase() !== expectedValue.toLowerCase()
          )
        case 'contains':
          return String(actualValue)
            .toLowerCase()
            .includes(expectedValue.toLowerCase())
        default:
          return false
      }
    } catch {
      return false
    }
  }

  /**
   * Interpolate variables in text
   */
  private interpolate(
    text: string,
    context: ConversationContext,
    message: BotIncomingMessage
  ): string {
    return text.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (match, path: string) => {
      const parts = path.split('.')

      if (parts[0] === 'contact') {
        const value = (message.contact as Record<string, unknown>)[parts[1]]
        return value !== undefined ? String(value) : match
      }

      if (parts[0] === 'var' || parts[0] === 'variables') {
        const value = context.variables[parts[1]]
        return value !== undefined ? String(value) : match
      }

      const value = context.variables[parts[0]]
      return value !== undefined ? String(value) : match
    })
  }

  /**
   * Evaluate a value (can be literal or variable reference)
   */
  private evaluateValue(
    value: unknown,
    context: ConversationContext,
    message: BotIncomingMessage
  ): unknown {
    if (
      typeof value === 'string' &&
      value.startsWith('{{') &&
      value.endsWith('}}')
    ) {
      return this.interpolate(value, context, message)
    }
    return value
  }

  /**
   * Fallback response for errors
   */
  private fallbackResponse(message: BotIncomingMessage): BotResponse {
    return {
      messages: [
        {
          type: 'interactive',
          interactive: {
            type: 'button',
            body: "I'm sorry, something went wrong. How can I help you?",
            buttons: [
              { id: 'menu_help', title: 'Main Menu' },
              { id: 'menu_human', title: 'Talk to Agent' },
            ],
          },
        },
      ],
      contextUpdates: clearFlow(message.context),
      actions: [],
      transferToHuman: false,
    }
  }

  /**
   * Debug logging
   */
  private debug(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[BOT_ENGINE] ${message}`, data || '')
    }
  }

  /**
   * Clear flow cache for organization
   */
  clearFlowCache(organizationId?: string): void {
    if (organizationId) {
      this.flowCache.delete(organizationId)
    } else {
      this.flowCache.clear()
    }
  }

  /**
   * Set flow cache TTL
   */
  setFlowCacheTTL(ttlMs: number): void {
    this.flowCacheTTL = ttlMs
  }
}

/**
 * Create a bot engine instance
 */
export function createBotEngine(config: BotEngineConfig): BotEngine {
  return new BotEngine(config)
}
