/**
 * @repo/whatsapp-core
 *
 * Production-grade WhatsApp Cloud API client
 *
 * @example
 * ```typescript
 * import {
 *   WhatsAppCloudApiService,
 *   MessageService,
 *   normalizePhone,
 *   verifyWebhookSignature
 * } from '@repo/whatsapp-core'
 *
 * // Create API client
 * const api = new WhatsAppCloudApiService({
 *   credentials: {
 *     phoneNumberId: 'your-phone-number-id',
 *     accessToken: 'your-access-token',
 *     wabaId: 'your-waba-id'
 *   }
 * })
 *
 * // Send a message
 * await api.sendText('+919876543210', 'Hello from WhatsApp!')
 *
 * // Use message service for validation
 * const messageService = new MessageService(api)
 * await messageService.sendButtons('+919876543210', 'Choose an option:', [
 *   { id: 'yes', title: 'Yes' },
 *   { id: 'no', title: 'No' }
 * ])
 * ```
 */

// ============================================================
// Services
// ============================================================

export { WhatsAppCloudApiService } from './services/cloud-api.service'
export type { CloudApiServiceConfig, Logger } from './services/cloud-api.service'

export { MessageService } from './services/message.service'
export type { SendMessageOptions, BulkMessageResult } from './services/message.service'

export { TemplateService } from './services/template.service'
export type { TemplateParam, TemplateSendOptions, CachedTemplate } from './services/template.service'

export { MediaService } from './services/media.service'
export type { MediaType, UploadedMedia } from './services/media.service'

// ============================================================
// Types
// ============================================================

// API types
export type {
  WhatsAppCredentials,
  MetaApiResponse,
  MetaApiError,
  SendMessageResponse,
  SendMessageContact,
  BusinessProfile,
  PhoneNumberInfo,
  MediaInfo,
  UploadMediaResponse,
  TemplateInfo,
  TemplateComponent,
  TemplateButton,
  TemplatesListResponse,
  WabaInfo,
  ConversationAnalytics,
} from './types/api.types'

// Message types
export type {
  MessageType,
  InteractiveType,
  BaseMessagePayload,
  TextMessagePayload,
  ImageMessagePayload,
  VideoMessagePayload,
  DocumentMessagePayload,
  AudioMessagePayload,
  StickerMessagePayload,
  LocationMessagePayload,
  ContactsMessagePayload,
  ContactInfo,
  ReactionMessagePayload,
  InteractiveButton,
  InteractiveListRow,
  InteractiveListSection,
  InteractiveHeader,
  InteractiveButtonMessagePayload,
  InteractiveListMessagePayload,
  InteractiveMessagePayload,
  TextTemplateParameter,
  CurrencyTemplateParameter,
  DateTimeTemplateParameter,
  ImageTemplateParameter,
  DocumentTemplateParameter,
  VideoTemplateParameter,
  TemplateParameter,
  TemplateComponentPayload,
  TemplateMessagePayload,
  MessagePayload,
  MessageContext,
  MessageWithContext,
  MarkAsReadPayload,
  TypingIndicatorPayload,
} from './types/message.types'

// Webhook types
export type {
  WebhookPayload,
  WebhookEntry,
  WebhookChange,
  WebhookValue,
  WebhookMetadata,
  WebhookContact,
  WebhookMessage,
  WebhookMessageType,
  WebhookMediaContent,
  WebhookDocumentContent,
  WebhookLocationContent,
  WebhookContactContent,
  WebhookInteractiveContent,
  WebhookButtonContent,
  WebhookReactionContent,
  WebhookOrderContent,
  WebhookSystemContent,
  WebhookReferral,
  WebhookStatus,
  WebhookError,
  TemplateStatusUpdate,
  ParsedIncomingMessage,
  ParsedStatusUpdate,
} from './types/webhook.types'

// Error types
export type {
  WhatsAppErrorMeta,
  WhatsAppErrorCode,
  SerializedWhatsAppError,
} from './types/error.types'

// ============================================================
// Errors
// ============================================================

export {
  WhatsAppError,
  WhatsAppAuthError,
  WhatsAppRateLimitError,
  WhatsAppValidationError,
  WhatsAppRecipientError,
  WhatsAppTemplateError,
  WhatsAppMediaError,
  WhatsAppWindowError,
  WhatsAppNetworkError,
  WhatsAppTimeoutError,
  isWhatsAppError,
  isRetryableError,
} from './errors/whatsapp-error'

// ============================================================
// Utilities
// ============================================================

// Phone utilities
export {
  normalizePhone,
  phoneToWaId,
  waIdToPhone,
  isValidWhatsAppNumber,
  getCountryCode,
  getPhoneSearchVariants,
  phoneNumbersMatch,
  formatPhoneForDisplay,
  maskPhone,
} from './utils/phone.utils'

// Retry utilities
export {
  withRetry,
  sleep,
  calculateBackoffDelay,
  createRetrier,
  withFallback,
  batchWithRetry,
  CircuitBreaker,
} from './utils/retry.utils'
export type { RetryOptions } from './utils/retry.utils'

// Signature utilities
export {
  verifyWebhookSignature,
  generateVerifyToken,
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  verifyWebhookChallenge,
  createRequestSignature,
} from './utils/signature.utils'

// ============================================================
// Constants
// ============================================================

export {
  WHATSAPP_API_VERSION,
  WHATSAPP_BASE_URL,
  MESSAGE_TYPES,
  INTERACTIVE_TYPES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_STATUSES,
  MESSAGE_STATUSES,
  RATE_LIMITS,
  TIMEOUTS,
  RETRY_CONFIG,
  MESSAGE_LIMITS,
  RETRYABLE_ERROR_CODES,
  META_ERROR_CODES,
  SUPPORTED_MEDIA_TYPES,
  MAX_FILE_SIZES,
} from './constants'

// ============================================================
// Bot Engine
// ============================================================

export * from './bot'

// ============================================================
// AI Classification
// ============================================================

export * from './ai'
