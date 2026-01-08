/**
 * WhatsApp Error Type Definitions
 */

// Error metadata interface
export interface WhatsAppErrorMeta {
  phoneNumberId?: string
  wabaId?: string
  messageId?: string
  to?: string
  retryable?: boolean
  retryAfter?: number
  originalError?: unknown
}

// Error code mapping
export type WhatsAppErrorCode =
  | 'AUTH_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'RECIPIENT_ERROR'
  | 'RECIPIENT_NOT_ON_WHATSAPP'
  | 'TEMPLATE_ERROR'
  | 'TEMPLATE_NOT_FOUND'
  | 'TEMPLATE_PARAM_MISMATCH'
  | 'TEMPLATE_PAUSED'
  | 'MEDIA_ERROR'
  | 'MEDIA_DOWNLOAD_ERROR'
  | 'MEDIA_UPLOAD_ERROR'
  | 'OUTSIDE_24H_WINDOW'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR'
  | `META_ERROR_${number}`
  | `META_ERROR_${number}_${number}`

// Serialized error for transport
export interface SerializedWhatsAppError {
  name: string
  message: string
  code: WhatsAppErrorCode | string
  httpStatus: number
  meta: WhatsAppErrorMeta
  stack?: string
}
