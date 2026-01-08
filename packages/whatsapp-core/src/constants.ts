/**
 * WhatsApp Cloud API Constants
 *
 * Central configuration for Meta WhatsApp Cloud API integration
 */

export const WHATSAPP_API_VERSION = 'v18.0'
export const WHATSAPP_BASE_URL = 'https://graph.facebook.com'

export const MESSAGE_TYPES = [
  'text',
  'image',
  'video',
  'audio',
  'document',
  'sticker',
  'location',
  'contacts',
  'interactive',
  'template',
  'reaction',
] as const

export const INTERACTIVE_TYPES = ['button', 'list', 'product', 'product_list'] as const

export const TEMPLATE_CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const

export const TEMPLATE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED'] as const

export const MESSAGE_STATUSES = ['pending', 'sent', 'delivered', 'read', 'failed'] as const

// Rate limits
export const RATE_LIMITS = {
  MESSAGES_PER_SECOND: 80, // Meta's limit per WABA
  MESSAGES_PER_PHONE_PER_SECOND: 1, // Recommended per recipient
  TEMPLATE_CREATES_PER_HOUR: 10,
}

// Timeouts
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  MEDIA_DOWNLOAD: 60000, // 60 seconds
  MEDIA_UPLOAD: 120000, // 120 seconds
}

// Retry settings
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 30000,
  BACKOFF_MULTIPLIER: 2,
}

// Message limits
export const MESSAGE_LIMITS = {
  TEXT_MAX_LENGTH: 4096,
  CAPTION_MAX_LENGTH: 1024,
  BUTTON_TITLE_MAX_LENGTH: 20,
  BUTTON_ID_MAX_LENGTH: 256,
  LIST_SECTION_TITLE_MAX_LENGTH: 24,
  LIST_ROW_TITLE_MAX_LENGTH: 24,
  LIST_ROW_DESCRIPTION_MAX_LENGTH: 72,
  MAX_BUTTONS: 3,
  MAX_LIST_SECTIONS: 10,
  MAX_LIST_ROWS_PER_SECTION: 10,
}

// Error codes that warrant retry
export const RETRYABLE_ERROR_CODES = [
  408, // Timeout
  429, // Rate limited
  500, // Internal server error
  502, // Bad gateway
  503, // Service unavailable
  504, // Gateway timeout
]

// Meta API error codes
export const META_ERROR_CODES = {
  // Rate limiting
  RATE_LIMIT_HIT: 130429,
  RATE_LIMIT_SPIKE_LIMIT: 131048,
  RATE_LIMIT_PAIR_LIMIT: 131056,

  // Authentication
  ACCESS_TOKEN_EXPIRED: 190,
  INVALID_ACCESS_TOKEN: 191,

  // Phone number
  PHONE_NUMBER_NOT_FOUND: 131026,
  PHONE_NOT_PART_OF_EXPERIMENT: 131031,
  RECIPIENT_NOT_ON_WHATSAPP: 131009,

  // Template
  TEMPLATE_NOT_FOUND: 132001,
  TEMPLATE_TEXT_MISMATCH: 132000,
  TEMPLATE_PARAM_MISMATCH: 132012,
  TEMPLATE_PAUSED: 132015,

  // Message
  MESSAGE_UNDELIVERABLE: 131047,
  MESSAGE_TOO_LONG: 131053,
  MEDIA_UPLOAD_ERROR: 131052,
  MEDIA_DOWNLOAD_ERROR: 131007,

  // Conversation
  OUTSIDE_24H_WINDOW: 131027,
  MISSING_TEMPLATE: 131040,
}

// Supported media MIME types
export const SUPPORTED_MEDIA_TYPES = {
  IMAGE: [
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
  VIDEO: [
    'video/mp4',
    'video/3gpp',
  ],
  AUDIO: [
    'audio/aac',
    'audio/mp4',
    'audio/mpeg',
    'audio/amr',
    'audio/ogg',
  ],
  DOCUMENT: [
    'text/plain',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  STICKER: [
    'image/webp',
  ],
}

// Max file sizes in bytes
export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  VIDEO: 16 * 1024 * 1024, // 16MB
  AUDIO: 16 * 1024 * 1024, // 16MB
  DOCUMENT: 100 * 1024 * 1024, // 100MB
  STICKER: 100 * 1024, // 100KB
}
