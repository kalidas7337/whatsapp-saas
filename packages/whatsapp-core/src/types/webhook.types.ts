/**
 * WhatsApp Webhook Type Definitions
 *
 * Types for webhook payloads received from Meta
 */

// Root webhook payload
export interface WebhookPayload {
  object: 'whatsapp_business_account'
  entry: WebhookEntry[]
}

// Webhook entry
export interface WebhookEntry {
  id: string // WABA ID
  changes: WebhookChange[]
}

// Webhook change
export interface WebhookChange {
  value: WebhookValue
  field: 'messages' | 'message_template_status_update'
}

// Webhook value (main content)
export interface WebhookValue {
  messaging_product: 'whatsapp'
  metadata: WebhookMetadata
  contacts?: WebhookContact[]
  messages?: WebhookMessage[]
  statuses?: WebhookStatus[]
  errors?: WebhookError[]
}

// Metadata from webhook
export interface WebhookMetadata {
  display_phone_number: string
  phone_number_id: string
}

// Contact info from webhook
export interface WebhookContact {
  wa_id: string
  profile: {
    name: string
  }
}

// Message from webhook
export interface WebhookMessage {
  id: string
  from: string
  timestamp: string
  type: WebhookMessageType

  // Context for replies
  context?: {
    from: string
    id: string
    referred_product?: {
      catalog_id: string
      product_retailer_id: string
    }
  }

  // Message content by type
  text?: {
    body: string
  }
  image?: WebhookMediaContent
  video?: WebhookMediaContent
  audio?: WebhookMediaContent
  document?: WebhookDocumentContent
  sticker?: WebhookMediaContent
  location?: WebhookLocationContent
  contacts?: WebhookContactContent[]
  interactive?: WebhookInteractiveContent
  button?: WebhookButtonContent
  reaction?: WebhookReactionContent
  order?: WebhookOrderContent
  system?: WebhookSystemContent
  errors?: WebhookError[]

  // Referral info (from ads)
  referral?: WebhookReferral
}

export type WebhookMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contacts'
  | 'interactive'
  | 'button'
  | 'reaction'
  | 'order'
  | 'system'
  | 'unknown'

// Media content in webhook
export interface WebhookMediaContent {
  id: string
  mime_type: string
  sha256: string
  caption?: string
}

// Document content in webhook
export interface WebhookDocumentContent extends WebhookMediaContent {
  filename?: string
}

// Location content in webhook
export interface WebhookLocationContent {
  latitude: number
  longitude: number
  name?: string
  address?: string
  url?: string
}

// Contact content in webhook
export interface WebhookContactContent {
  addresses?: Array<{
    city?: string
    country?: string
    country_code?: string
    state?: string
    street?: string
    type?: string
    zip?: string
  }>
  birthday?: string
  emails?: Array<{
    email?: string
    type?: string
  }>
  name: {
    formatted_name: string
    first_name?: string
    last_name?: string
    middle_name?: string
    prefix?: string
    suffix?: string
  }
  org?: {
    company?: string
    department?: string
    title?: string
  }
  phones?: Array<{
    phone?: string
    type?: string
    wa_id?: string
  }>
  urls?: Array<{
    url?: string
    type?: string
  }>
}

// Interactive content in webhook (user's selection)
export interface WebhookInteractiveContent {
  type: 'button_reply' | 'list_reply' | 'nfm_reply'
  button_reply?: {
    id: string
    title: string
  }
  list_reply?: {
    id: string
    title: string
    description?: string
  }
  nfm_reply?: {
    response_json: string
    body: string
    name: string
  }
}

// Button content (Quick Reply template response)
export interface WebhookButtonContent {
  text: string
  payload: string
}

// Reaction content
export interface WebhookReactionContent {
  message_id: string
  emoji: string // Empty string means reaction removed
}

// Order content
export interface WebhookOrderContent {
  catalog_id: string
  product_items: Array<{
    product_retailer_id: string
    quantity: number
    item_price: number
    currency: string
  }>
  text?: string
}

// System message content
export interface WebhookSystemContent {
  body: string
  identity: string
  wa_id?: string
  type?: 'customer_changed_number' | 'customer_identity_changed'
  customer?: string
}

// Referral info
export interface WebhookReferral {
  source_url: string
  source_type: 'ad' | 'post'
  source_id: string
  headline?: string
  body?: string
  media_type?: 'image' | 'video'
  image_url?: string
  video_url?: string
  thumbnail_url?: string
  ctwa_clid?: string
}

// Message status update
export interface WebhookStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  conversation?: {
    id: string
    expiration_timestamp?: string
    origin: {
      type: 'business_initiated' | 'user_initiated' | 'referral_conversion'
    }
  }
  pricing?: {
    billable: boolean
    pricing_model: 'CBP'
    category: 'business_initiated' | 'user_initiated' | 'referral_conversion' | 'authentication' | 'marketing' | 'utility' | 'service'
  }
  errors?: WebhookError[]
}

// Error in webhook
export interface WebhookError {
  code: number
  title: string
  message?: string
  error_data?: {
    details: string
  }
  href?: string
}

// Template status update webhook
export interface TemplateStatusUpdate {
  event: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PENDING_DELETION' | 'DELETED' | 'DISABLED' | 'PAUSED' | 'IN_APPEAL' | 'REINSTATED'
  message_template_id: number
  message_template_name: string
  message_template_language: string
  reason?: string
  other_info?: {
    title?: string
    description?: string
  }
}

// Parsed webhook types for easier handling
export interface ParsedIncomingMessage {
  messageId: string
  from: string
  fromName: string
  timestamp: Date
  type: WebhookMessageType
  phoneNumberId: string
  wabaId: string

  // Typed content
  text?: string
  caption?: string
  mediaId?: string
  mimeType?: string
  filename?: string
  location?: {
    latitude: number
    longitude: number
    name?: string
    address?: string
  }
  contacts?: WebhookContactContent[]
  interactiveReply?: {
    type: 'button' | 'list'
    id: string
    title: string
    description?: string
  }
  reaction?: {
    messageId: string
    emoji: string
    isRemoved: boolean
  }

  // Context
  replyToMessageId?: string
  referral?: WebhookReferral

  // Raw data for advanced use
  raw: WebhookMessage
}

export interface ParsedStatusUpdate {
  messageId: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: Date
  recipientId: string
  conversationId?: string
  pricing?: WebhookStatus['pricing']
  error?: WebhookError

  // Raw data for advanced use
  raw: WebhookStatus
}
