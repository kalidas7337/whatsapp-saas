/**
 * Bot Engine Types
 */

// Intent detection result
export interface DetectedIntent {
  name: string
  confidence: number
  entities: Record<string, unknown>
  rawInput: string
}

// Conversation context stored in bot_context JSON
export interface ConversationContext {
  // Current state
  currentFlowId?: string
  currentNodeId?: string
  awaitingInput?: boolean
  awaitingInputType?: 'text' | 'button' | 'list' | 'any'

  // Variables collected during conversation
  variables: Record<string, unknown>

  // History for context
  lastIntents: string[]
  lastResponses: string[]

  // Timestamps
  flowStartedAt?: number
  lastInteractionAt: number

  // Metadata
  language: string
  timezone: string
}

// Incoming message for bot processing
export interface BotIncomingMessage {
  id: string
  wamid: string
  conversationId: string
  contactId: string
  organizationId: string

  // Message content
  type:
    | 'text'
    | 'interactive'
    | 'button'
    | 'image'
    | 'document'
    | 'audio'
    | 'video'
    | 'location'
    | 'reaction'
  text?: string

  // Interactive response
  buttonId?: string
  buttonTitle?: string
  listId?: string
  listTitle?: string

  // Media
  mediaId?: string
  mediaType?: string
  caption?: string

  // Location
  latitude?: number
  longitude?: number

  // Contact info
  contact: {
    id: string
    phone: string
    name?: string
    tags: string[]
  }

  // Current context
  context: ConversationContext

  // Mode
  mode: 'STANDALONE' | 'INTEGRATED'
  pmsClientId?: string
}

// Bot response
export interface BotResponse {
  // What to send
  messages: BotResponseMessage[]

  // Context updates
  contextUpdates: Partial<ConversationContext>

  // Actions to take
  actions: BotAction[]

  // Should transfer to human?
  transferToHuman: boolean
  transferReason?: string
}

export interface BotResponseMessage {
  type: 'text' | 'template' | 'image' | 'document' | 'interactive'

  // Text message
  text?: string

  // Template message
  template?: {
    name: string
    language: string
    components?: unknown[]
  }

  // Media message
  media?: {
    type: 'image' | 'document' | 'video' | 'audio'
    url: string
    caption?: string
    filename?: string
  }

  // Interactive message
  interactive?: {
    type: 'button' | 'list'
    header?: string
    body: string
    footer?: string
    buttons?: Array<{
      id: string
      title: string
    }>
    sections?: Array<{
      title?: string
      rows: Array<{
        id: string
        title: string
        description?: string
      }>
    }>
    buttonText?: string
  }

  // Delay before sending (ms)
  delay?: number
}

export interface BotAction {
  type:
    | 'add_tag'
    | 'remove_tag'
    | 'set_variable'
    | 'update_contact'
    | 'create_task'
    | 'send_notification'
  payload: Record<string, unknown>
}

// Flow definition (stored in whatsapp_chatbot_flows)
export interface ChatbotFlow {
  id: string
  organizationId: string
  name: string
  triggerType: FlowTriggerType
  triggerKeywords: string[]
  triggerPattern?: string
  isActive: boolean
  priority: number
  flowDefinition: FlowDefinition
}

export type FlowTriggerType =
  | 'KEYWORD'
  | 'FIRST_MESSAGE'
  | 'BUTTON_REPLY'
  | 'LIST_REPLY'
  | 'REGEX_PATTERN'
  | 'ALL_MESSAGES'
  | 'INACTIVITY'

export interface FlowDefinition {
  startNodeId: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  variables: string[]
}

export interface FlowNode {
  id: string
  type: FlowNodeType
  data: Record<string, unknown>
  position?: { x: number; y: number }
}

export type FlowNodeType =
  | 'SEND_MESSAGE'
  | 'SEND_TEMPLATE'
  | 'SEND_MEDIA'
  | 'SEND_BUTTONS'
  | 'SEND_LIST'
  | 'ASK_QUESTION'
  | 'CONDITION'
  | 'SET_VARIABLE'
  | 'HTTP_REQUEST'
  | 'ASSIGN_AGENT'
  | 'ADD_TAG'
  | 'REMOVE_TAG'
  | 'DELAY'
  | 'END'

export interface FlowEdge {
  id: string
  source: string
  target: string
  condition?: string // For condition nodes
  label?: string
}

// Node processor context
export interface NodeContext {
  message: BotIncomingMessage
  context: ConversationContext
  flow: ChatbotFlow
  currentNode: FlowNode
  organizationId: string
  mode: 'STANDALONE' | 'INTEGRATED'
}

// Node processor result
export interface NodeResult {
  response?: BotResponseMessage
  nextNodeId?: string
  contextUpdates?: Partial<ConversationContext>
  actions?: BotAction[]
  waitForInput?: boolean
  transferToHuman?: boolean
}

// Intent handler function
export type IntentHandler = (
  message: BotIncomingMessage,
  context: ConversationContext
) => Promise<BotResponse>

// Node processor function
export type NodeProcessor = (ctx: NodeContext) => Promise<NodeResult>

// Intent pattern configuration
export interface IntentPatternConfig {
  keywords: string[]
  patterns?: RegExp[]
  priority: number
}
