/**
 * Meta Graph API Type Definitions
 *
 * Types for WhatsApp Cloud API requests and responses
 */

// Meta Graph API credentials
export interface WhatsAppCredentials {
  phoneNumberId: string
  accessToken: string
  wabaId: string
  apiVersion?: string
}

// Generic API response wrapper
export interface MetaApiResponse<T = unknown> {
  data?: T
  error?: MetaApiError
  paging?: {
    cursors: { before: string; after: string }
    next?: string
    previous?: string
  }
}

// Meta API error structure
export interface MetaApiError {
  message: string
  type: string
  code: number
  error_subcode?: number
  error_data?: {
    messaging_product: string
    details: string
  }
  fbtrace_id: string
}

// Contact in send message response
export interface SendMessageContact {
  input: string
  wa_id: string
}

// Send message response
export interface SendMessageResponse {
  messaging_product: 'whatsapp'
  contacts: SendMessageContact[]
  messages: Array<{
    id: string // wamid
    message_status?: string
  }>
}

// Business profile
export interface BusinessProfile {
  messaging_product: 'whatsapp'
  about?: string
  address?: string
  description?: string
  email?: string
  profile_picture_url?: string
  websites?: string[]
  vertical?: string
}

// Phone number info
export interface PhoneNumberInfo {
  id: string
  verified_name: string
  display_phone_number: string
  quality_rating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'
  messaging_limit_tier?: string
  code_verification_status?: string
  platform_type?: string
  throughput?: {
    level: string
  }
}

// Media info
export interface MediaInfo {
  id: string
  url: string
  mime_type: string
  sha256: string
  file_size: number
  messaging_product: 'whatsapp'
}

// Upload media response
export interface UploadMediaResponse {
  id: string
}

// Template info from API
export interface TemplateInfo {
  id: string
  name: string
  language: string
  status: string
  category: string
  components: TemplateComponent[]
  quality_score?: {
    score: string
    date: number
  }
}

// Template component structure
export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION'
  text?: string
  example?: {
    header_text?: string[]
    body_text?: string[][]
    header_handle?: string[]
  }
  buttons?: TemplateButton[]
}

// Template button
export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'OTP' | 'COPY_CODE'
  text: string
  url?: string
  phone_number?: string
  example?: string[]
}

// Templates list response
export interface TemplatesListResponse {
  data: TemplateInfo[]
  paging?: {
    cursors: { before: string; after: string }
    next?: string
  }
}

// WABA info
export interface WabaInfo {
  id: string
  name: string
  timezone_id: string
  message_template_namespace: string
}

// Conversation analytics
export interface ConversationAnalytics {
  conversation_analytics: {
    data: Array<{
      data_points: Array<{
        start: number
        end: number
        conversation: number
        phone_number: string
        country: string
        conversation_type: string
        conversation_direction: string
        cost: number
      }>
    }>
  }
}
