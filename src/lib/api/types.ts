/**
 * External API & Webhook Types
 * PROMPT 32: External Webhooks & Public API System
 */

// ============================================================================
// API Key Types
// ============================================================================

export interface APIKey {
  id: string
  organizationId: string
  name: string
  keyPrefix: string // First 8 chars for display
  keyHash: string // Hashed full key
  scopes: APIScope[]
  lastUsedAt: Date | null
  expiresAt: Date | null
  isActive: boolean
  createdBy: string
  createdAt: Date
}

export type APIScope =
  | 'messages:read'
  | 'messages:write'
  | 'conversations:read'
  | 'conversations:write'
  | 'contacts:read'
  | 'contacts:write'
  | 'templates:read'
  | 'broadcasts:read'
  | 'broadcasts:write'
  | 'webhooks:read'
  | 'webhooks:write'

export interface CreateAPIKeyInput {
  name: string
  scopes: APIScope[]
  expiresAt?: Date
}

export interface APIKeyWithSecret extends APIKey {
  secret: string // Only returned on creation
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface Webhook {
  id: string
  organizationId: string
  url: string
  secret: string
  events: WebhookEvent[]
  isActive: boolean
  description?: string
  headers?: Record<string, string>
  failureCount: number
  lastTriggeredAt: Date | null
  lastSuccessAt: Date | null
  lastFailureAt: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type WebhookEvent =
  // Message events
  | 'message.received'
  | 'message.sent'
  | 'message.delivered'
  | 'message.read'
  | 'message.failed'
  // Conversation events
  | 'conversation.created'
  | 'conversation.assigned'
  | 'conversation.resolved'
  | 'conversation.reopened'
  // Contact events
  | 'contact.created'
  | 'contact.updated'
  | 'contact.opted_out'
  // Campaign events
  | 'campaign.started'
  | 'campaign.completed'
  | 'campaign.failed'

export interface CreateWebhookInput {
  url: string
  events: WebhookEvent[]
  description?: string
  headers?: Record<string, string>
}

export interface UpdateWebhookInput {
  url?: string
  events?: WebhookEvent[]
  description?: string
  headers?: Record<string, string>
  isActive?: boolean
}

export interface WebhookPayload {
  id: string
  event: WebhookEvent
  timestamp: string
  organizationId: string
  data: Record<string, unknown>
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: WebhookEvent
  payload: WebhookPayload
  status: 'pending' | 'success' | 'failed'
  statusCode?: number
  response?: string
  attempts: number
  nextRetryAt?: Date
  createdAt: Date
  deliveredAt?: Date
}

export interface WebhookTestResult {
  success: boolean
  statusCode?: number
  responseTime: number
  error?: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  cursor?: string
}

// ============================================================================
// Rate Limiting
// ============================================================================

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number // Unix timestamp
}

export interface RateLimitRecord {
  count: number
  resetAt: number
}

// ============================================================================
// API Request Context
// ============================================================================

export interface APIContext {
  organizationId: string
  apiKeyId: string
  scopes: APIScope[]
}

export interface ValidateAPIKeyResult {
  context: APIContext | null
  error: APIResponse | null
}

// ============================================================================
// Event Definitions
// ============================================================================

export interface WebhookEventDefinition {
  category: string
  description: string
}

export const WEBHOOK_EVENTS: Record<WebhookEvent, WebhookEventDefinition> = {
  'message.received': {
    category: 'Messages',
    description: 'New message received from customer',
  },
  'message.sent': {
    category: 'Messages',
    description: 'Message sent to customer',
  },
  'message.delivered': {
    category: 'Messages',
    description: 'Message delivered to customer device',
  },
  'message.read': {
    category: 'Messages',
    description: 'Message read by customer',
  },
  'message.failed': {
    category: 'Messages',
    description: 'Message delivery failed',
  },
  'conversation.created': {
    category: 'Conversations',
    description: 'New conversation started',
  },
  'conversation.assigned': {
    category: 'Conversations',
    description: 'Conversation assigned to agent',
  },
  'conversation.resolved': {
    category: 'Conversations',
    description: 'Conversation marked as resolved',
  },
  'conversation.reopened': {
    category: 'Conversations',
    description: 'Resolved conversation reopened',
  },
  'contact.created': {
    category: 'Contacts',
    description: 'New contact created',
  },
  'contact.updated': {
    category: 'Contacts',
    description: 'Contact information updated',
  },
  'contact.opted_out': {
    category: 'Contacts',
    description: 'Contact opted out of messages',
  },
  'campaign.started': {
    category: 'Campaigns',
    description: 'Broadcast campaign started',
  },
  'campaign.completed': {
    category: 'Campaigns',
    description: 'Broadcast campaign completed',
  },
  'campaign.failed': {
    category: 'Campaigns',
    description: 'Broadcast campaign failed',
  },
}

// ============================================================================
// Scope Definitions
// ============================================================================

export interface APIScopeDefinition {
  name: string
  description: string
  category: string
}

export const API_SCOPES: Record<APIScope, APIScopeDefinition> = {
  'messages:read': {
    name: 'Read Messages',
    description: 'View messages and message history',
    category: 'Messages',
  },
  'messages:write': {
    name: 'Send Messages',
    description: 'Send messages to contacts',
    category: 'Messages',
  },
  'conversations:read': {
    name: 'Read Conversations',
    description: 'View conversations and their details',
    category: 'Conversations',
  },
  'conversations:write': {
    name: 'Manage Conversations',
    description: 'Update, assign, and close conversations',
    category: 'Conversations',
  },
  'contacts:read': {
    name: 'Read Contacts',
    description: 'View contact information',
    category: 'Contacts',
  },
  'contacts:write': {
    name: 'Manage Contacts',
    description: 'Create, update, and delete contacts',
    category: 'Contacts',
  },
  'templates:read': {
    name: 'Read Templates',
    description: 'View message templates',
    category: 'Templates',
  },
  'broadcasts:read': {
    name: 'Read Broadcasts',
    description: 'View broadcast campaigns',
    category: 'Broadcasts',
  },
  'broadcasts:write': {
    name: 'Manage Broadcasts',
    description: 'Create and manage broadcast campaigns',
    category: 'Broadcasts',
  },
  'webhooks:read': {
    name: 'Read Webhooks',
    description: 'View webhook configurations',
    category: 'Webhooks',
  },
  'webhooks:write': {
    name: 'Manage Webhooks',
    description: 'Create, update, and delete webhooks',
    category: 'Webhooks',
  },
}

// Get all available scopes
export const ALL_SCOPES = Object.keys(API_SCOPES) as APIScope[]

// Get all available events
export const ALL_EVENTS = Object.keys(WEBHOOK_EVENTS) as WebhookEvent[]
