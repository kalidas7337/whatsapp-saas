/**
 * Response Builder
 *
 * Builds WhatsApp Cloud API payloads from bot responses
 */

import { BotResponseMessage } from './types'
import {
  TextMessagePayload,
  TemplateMessagePayload,
  InteractiveMessagePayload,
  ImageMessagePayload,
  DocumentMessagePayload,
} from '../types/message.types'

// Union type for all message payloads
export type MessagePayload =
  | TextMessagePayload
  | TemplateMessagePayload
  | InteractiveMessagePayload
  | ImageMessagePayload
  | DocumentMessagePayload

/**
 * Build WhatsApp Cloud API payload from bot response
 */
export function buildMessagePayload(
  to: string,
  response: BotResponseMessage
): MessagePayload {
  const base = {
    messaging_product: 'whatsapp' as const,
    recipient_type: 'individual' as const,
    to,
  }

  switch (response.type) {
    case 'text':
      return {
        ...base,
        type: 'text',
        text: {
          body: response.text!,
          preview_url: false,
        },
      } as TextMessagePayload

    case 'template':
      return {
        ...base,
        type: 'template',
        template: {
          name: response.template!.name,
          language: { code: response.template!.language },
          components: response.template!.components,
        },
      } as TemplateMessagePayload

    case 'interactive':
      return buildInteractivePayload(to, response)

    case 'image':
      return {
        ...base,
        type: 'image',
        image: {
          link: response.media!.url,
          caption: response.media!.caption,
        },
      } as ImageMessagePayload

    case 'document':
      return {
        ...base,
        type: 'document',
        document: {
          link: response.media!.url,
          caption: response.media!.caption,
          filename: response.media!.filename,
        },
      } as DocumentMessagePayload

    default:
      throw new Error(`Unsupported response type: ${response.type}`)
  }
}

/**
 * Build interactive message payload
 */
function buildInteractivePayload(
  to: string,
  response: BotResponseMessage
): InteractiveMessagePayload {
  const interactive = response.interactive!

  const payload: InteractiveMessagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: interactive.type,
      body: { text: interactive.body },
      action: {} as InteractiveMessagePayload['interactive']['action'],
    },
  }

  // Add header if present
  if (interactive.header) {
    payload.interactive.header = {
      type: 'text',
      text: interactive.header,
    }
  }

  // Add footer if present
  if (interactive.footer) {
    payload.interactive.footer = { text: interactive.footer }
  }

  // Build action based on type
  if (interactive.type === 'button' && interactive.buttons) {
    payload.interactive.action = {
      buttons: interactive.buttons.map((btn) => ({
        type: 'reply' as const,
        reply: {
          id: btn.id,
          title: btn.title.substring(0, 20), // Max 20 chars
        },
      })),
    }
  } else if (interactive.type === 'list' && interactive.sections) {
    payload.interactive.action = {
      button: interactive.buttonText || 'Select',
      sections: interactive.sections.map((section) => ({
        title: section.title?.substring(0, 24), // Max 24 chars
        rows: section.rows.map((row) => ({
          id: row.id,
          title: row.title.substring(0, 24), // Max 24 chars
          description: row.description?.substring(0, 72), // Max 72 chars
        })),
      })),
    }
  }

  return payload
}

/**
 * Create a simple text response
 */
export function textResponse(text: string): BotResponseMessage {
  return { type: 'text', text }
}

/**
 * Create a button response
 */
export function buttonResponse(
  body: string,
  buttons: Array<{ id: string; title: string }>,
  options: { header?: string; footer?: string } = {}
): BotResponseMessage {
  return {
    type: 'interactive',
    interactive: {
      type: 'button',
      header: options.header,
      body,
      footer: options.footer,
      buttons: buttons.slice(0, 3), // Max 3 buttons
    },
  }
}

/**
 * Create a list response
 */
export function listResponse(
  body: string,
  sections: Array<{
    title?: string
    rows: Array<{
      id: string
      title: string
      description?: string
    }>
  }>,
  options: { header?: string; footer?: string; buttonText?: string } = {}
): BotResponseMessage {
  return {
    type: 'interactive',
    interactive: {
      type: 'list',
      header: options.header,
      body,
      footer: options.footer,
      buttonText: options.buttonText || 'Select Option',
      sections,
    },
  }
}

/**
 * Create a template response
 */
export function templateResponse(
  name: string,
  language: string = 'en',
  components?: unknown[]
): BotResponseMessage {
  return {
    type: 'template',
    template: { name, language, components },
  }
}

/**
 * Create an image response
 */
export function imageResponse(
  url: string,
  caption?: string
): BotResponseMessage {
  return {
    type: 'image',
    media: {
      type: 'image',
      url,
      caption,
    },
  }
}

/**
 * Create a document response
 */
export function documentResponse(
  url: string,
  filename: string,
  caption?: string
): BotResponseMessage {
  return {
    type: 'document',
    media: {
      type: 'document',
      url,
      filename,
      caption,
    },
  }
}

/**
 * Add delay to a response
 */
export function withDelay(
  response: BotResponseMessage,
  delayMs: number
): BotResponseMessage {
  return {
    ...response,
    delay: delayMs,
  }
}

/**
 * Create a quick reply response (shorthand for button)
 */
export function quickReplies(
  body: string,
  options: string[]
): BotResponseMessage {
  return buttonResponse(
    body,
    options.slice(0, 3).map((opt, i) => ({
      id: `quick_${i}`,
      title: opt.substring(0, 20),
    }))
  )
}
