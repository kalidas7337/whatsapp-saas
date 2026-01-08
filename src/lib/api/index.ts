/**
 * External API & Webhooks Module
 * PROMPT 32: External Webhooks & Public API System
 */

// Types
export * from './types'

// Middleware
export {
  validateAPIKey,
  hasScope,
  requireScope,
  requireAnyScope,
  checkRateLimit,
  addRateLimitHeaders,
  hashAPIKey,
  generateAPIKey,
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
  logAPIRequest,
  successResponse,
  errorResponse,
  paginatedResponse,
} from './middleware'

// Services
export { APIKeyService, createAPIKeyService } from './api-keys.service'
export { WebhookService, createWebhookService } from './webhooks.service'

// Dispatcher
export {
  WebhookDispatcher,
  dispatchMessageReceived,
  dispatchMessageSent,
  dispatchMessageDelivered,
  dispatchMessageRead,
  dispatchMessageFailed,
  dispatchConversationCreated,
  dispatchConversationAssigned,
  dispatchConversationResolved,
  dispatchConversationReopened,
  dispatchContactCreated,
  dispatchContactUpdated,
  dispatchContactOptedOut,
  dispatchCampaignStarted,
  dispatchCampaignCompleted,
  dispatchCampaignFailed,
} from './webhook-dispatcher'
