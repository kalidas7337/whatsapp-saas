/**
 * WhatsApp Message Type Definitions
 *
 * Types for all message payloads sent via WhatsApp Cloud API
 */

import { MESSAGE_TYPES, INTERACTIVE_TYPES } from '../constants'

export type MessageType = (typeof MESSAGE_TYPES)[number]
export type InteractiveType = (typeof INTERACTIVE_TYPES)[number]

// Base message payload
export interface BaseMessagePayload {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
}

// Text message
export interface TextMessagePayload extends BaseMessagePayload {
  type: 'text'
  text: {
    preview_url?: boolean
    body: string
  }
}

// Image message
export interface ImageMessagePayload extends BaseMessagePayload {
  type: 'image'
  image: {
    id?: string
    link?: string
    caption?: string
  }
}

// Video message
export interface VideoMessagePayload extends BaseMessagePayload {
  type: 'video'
  video: {
    id?: string
    link?: string
    caption?: string
  }
}

// Document message
export interface DocumentMessagePayload extends BaseMessagePayload {
  type: 'document'
  document: {
    id?: string
    link?: string
    caption?: string
    filename?: string
  }
}

// Audio message
export interface AudioMessagePayload extends BaseMessagePayload {
  type: 'audio'
  audio: {
    id?: string
    link?: string
  }
}

// Sticker message
export interface StickerMessagePayload extends BaseMessagePayload {
  type: 'sticker'
  sticker: {
    id?: string
    link?: string
  }
}

// Location message
export interface LocationMessagePayload extends BaseMessagePayload {
  type: 'location'
  location: {
    latitude: number
    longitude: number
    name?: string
    address?: string
  }
}

// Contact info for contact message
export interface ContactInfo {
  addresses?: Array<{
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    country_code?: string
    type?: 'HOME' | 'WORK'
  }>
  birthday?: string
  emails?: Array<{
    email?: string
    type?: 'HOME' | 'WORK'
  }>
  name: {
    formatted_name: string
    first_name?: string
    last_name?: string
    middle_name?: string
    suffix?: string
    prefix?: string
  }
  org?: {
    company?: string
    department?: string
    title?: string
  }
  phones?: Array<{
    phone?: string
    type?: 'CELL' | 'MAIN' | 'IPHONE' | 'HOME' | 'WORK'
    wa_id?: string
  }>
  urls?: Array<{
    url?: string
    type?: 'HOME' | 'WORK'
  }>
}

// Contact message
export interface ContactsMessagePayload extends BaseMessagePayload {
  type: 'contacts'
  contacts: ContactInfo[]
}

// Reaction message
export interface ReactionMessagePayload extends BaseMessagePayload {
  type: 'reaction'
  reaction: {
    message_id: string
    emoji: string // Empty string to remove reaction
  }
}

// Interactive button
export interface InteractiveButton {
  type: 'reply'
  reply: {
    id: string
    title: string
  }
}

// Interactive list row
export interface InteractiveListRow {
  id: string
  title: string
  description?: string
}

// Interactive list section
export interface InteractiveListSection {
  title?: string
  rows: InteractiveListRow[]
}

// Interactive header
export interface InteractiveHeader {
  type: 'text' | 'image' | 'video' | 'document'
  text?: string
  image?: { id?: string; link?: string }
  video?: { id?: string; link?: string }
  document?: { id?: string; link?: string; filename?: string }
}

// Interactive message - Button type
export interface InteractiveButtonMessagePayload extends BaseMessagePayload {
  type: 'interactive'
  interactive: {
    type: 'button'
    header?: InteractiveHeader
    body: {
      text: string
    }
    footer?: {
      text: string
    }
    action: {
      buttons: InteractiveButton[]
    }
  }
}

// Interactive message - List type
export interface InteractiveListMessagePayload extends BaseMessagePayload {
  type: 'interactive'
  interactive: {
    type: 'list'
    header?: InteractiveHeader
    body: {
      text: string
    }
    footer?: {
      text: string
    }
    action: {
      button: string
      sections: InteractiveListSection[]
    }
  }
}

// Generic interactive message payload
export interface InteractiveMessagePayload extends BaseMessagePayload {
  type: 'interactive'
  interactive: {
    type: InteractiveType
    header?: InteractiveHeader
    body: {
      text: string
    }
    footer?: {
      text: string
    }
    action: {
      buttons?: InteractiveButton[]
      button?: string // For list type
      sections?: InteractiveListSection[]
      // For product/product_list types
      catalog_id?: string
      product_retailer_id?: string
    }
  }
}

// Template parameter types
export interface TextTemplateParameter {
  type: 'text'
  text: string
}

export interface CurrencyTemplateParameter {
  type: 'currency'
  currency: {
    code: string
    amount_1000: number
    fallback_value: string
  }
}

export interface DateTimeTemplateParameter {
  type: 'date_time'
  date_time: {
    fallback_value: string
  }
}

export interface ImageTemplateParameter {
  type: 'image'
  image: { id?: string; link?: string }
}

export interface DocumentTemplateParameter {
  type: 'document'
  document: { id?: string; link?: string; filename?: string }
}

export interface VideoTemplateParameter {
  type: 'video'
  video: { id?: string; link?: string }
}

export type TemplateParameter =
  | TextTemplateParameter
  | CurrencyTemplateParameter
  | DateTimeTemplateParameter
  | ImageTemplateParameter
  | DocumentTemplateParameter
  | VideoTemplateParameter

// Template component for sending
export interface TemplateComponentPayload {
  type: 'header' | 'body' | 'button'
  sub_type?: 'quick_reply' | 'url'
  index?: number | string
  parameters?: TemplateParameter[]
}

// Template message
export interface TemplateMessagePayload extends BaseMessagePayload {
  type: 'template'
  template: {
    name: string
    language: {
      code: string
    }
    components?: TemplateComponentPayload[]
  }
}

// Union type for all message payloads
export type MessagePayload =
  | TextMessagePayload
  | ImageMessagePayload
  | VideoMessagePayload
  | DocumentMessagePayload
  | AudioMessagePayload
  | StickerMessagePayload
  | LocationMessagePayload
  | ContactsMessagePayload
  | ReactionMessagePayload
  | InteractiveMessagePayload
  | InteractiveButtonMessagePayload
  | InteractiveListMessagePayload
  | TemplateMessagePayload

// Context for replies
export interface MessageContext {
  message_id: string
}

// Full message with context
export type MessageWithContext<T extends MessagePayload> = T & {
  context?: MessageContext
}

// Mark as read payload
export interface MarkAsReadPayload {
  messaging_product: 'whatsapp'
  status: 'read'
  message_id: string
}

// Typing indicator payload
export interface TypingIndicatorPayload {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  status: 'typing'
}
