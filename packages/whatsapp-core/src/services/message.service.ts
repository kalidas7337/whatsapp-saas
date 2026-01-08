/**
 * Message Service
 *
 * Higher-level message operations built on top of Cloud API service
 */

import { WhatsAppCloudApiService } from './cloud-api.service'
import { SendMessageResponse } from '../types/api.types'
import { MESSAGE_LIMITS } from '../constants'
import { WhatsAppValidationError } from '../errors/whatsapp-error'
import { normalizePhone, isValidWhatsAppNumber } from '../utils/phone.utils'

/**
 * Message sending options
 */
export interface SendMessageOptions {
  /** Reply to a specific message */
  replyTo?: string
  /** Preview URL in text messages */
  previewUrl?: boolean
}

/**
 * Bulk message result
 */
export interface BulkMessageResult {
  phone: string
  success: boolean
  messageId?: string
  waId?: string
  error?: string
}

/**
 * Message Service
 *
 * Provides validated, higher-level message operations
 */
export class MessageService {
  constructor(private readonly api: WhatsAppCloudApiService) {}

  /**
   * Send a validated text message
   */
  async sendText(
    to: string,
    text: string,
    options: SendMessageOptions = {}
  ): Promise<SendMessageResponse> {
    // Validate phone number
    const normalizedPhone = normalizePhone(to)
    if (!isValidWhatsAppNumber(normalizedPhone)) {
      throw new WhatsAppValidationError(`Invalid phone number: ${to}`)
    }

    // Validate text length
    if (text.length > MESSAGE_LIMITS.TEXT_MAX_LENGTH) {
      throw new WhatsAppValidationError(
        `Text exceeds maximum length of ${MESSAGE_LIMITS.TEXT_MAX_LENGTH} characters`
      )
    }

    if (text.length === 0) {
      throw new WhatsAppValidationError('Text cannot be empty')
    }

    return this.api.sendText(normalizedPhone, text, options)
  }

  /**
   * Send a text message with auto-chunking for long messages
   */
  async sendLongText(
    to: string,
    text: string,
    options: SendMessageOptions = {}
  ): Promise<SendMessageResponse[]> {
    const normalizedPhone = normalizePhone(to)
    if (!isValidWhatsAppNumber(normalizedPhone)) {
      throw new WhatsAppValidationError(`Invalid phone number: ${to}`)
    }

    // Split into chunks if needed
    const chunks = this.splitText(text, MESSAGE_LIMITS.TEXT_MAX_LENGTH)
    const results: SendMessageResponse[] = []

    for (let i = 0; i < chunks.length; i++) {
      // Only apply replyTo on first message
      const chunkOptions = i === 0 ? options : { previewUrl: options.previewUrl }
      const result = await this.api.sendText(normalizedPhone, chunks[i], chunkOptions)
      results.push(result)
    }

    return results
  }

  /**
   * Send image with validation
   */
  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<SendMessageResponse> {
    const normalizedPhone = normalizePhone(to)
    if (!isValidWhatsAppNumber(normalizedPhone)) {
      throw new WhatsAppValidationError(`Invalid phone number: ${to}`)
    }

    if (caption && caption.length > MESSAGE_LIMITS.CAPTION_MAX_LENGTH) {
      throw new WhatsAppValidationError(
        `Caption exceeds maximum length of ${MESSAGE_LIMITS.CAPTION_MAX_LENGTH} characters`
      )
    }

    return this.api.sendImage(normalizedPhone, imageUrl, caption)
  }

  /**
   * Send document with validation
   */
  async sendDocument(
    to: string,
    documentUrl: string,
    filename?: string,
    caption?: string
  ): Promise<SendMessageResponse> {
    const normalizedPhone = normalizePhone(to)
    if (!isValidWhatsAppNumber(normalizedPhone)) {
      throw new WhatsAppValidationError(`Invalid phone number: ${to}`)
    }

    if (caption && caption.length > MESSAGE_LIMITS.CAPTION_MAX_LENGTH) {
      throw new WhatsAppValidationError(
        `Caption exceeds maximum length of ${MESSAGE_LIMITS.CAPTION_MAX_LENGTH} characters`
      )
    }

    return this.api.sendDocument(normalizedPhone, documentUrl, filename, caption)
  }

  /**
   * Send interactive buttons with validation
   */
  async sendButtons(
    to: string,
    body: string,
    buttons: Array<{ id: string; title: string }>,
    options: { header?: string; footer?: string } = {}
  ): Promise<SendMessageResponse> {
    const normalizedPhone = normalizePhone(to)
    if (!isValidWhatsAppNumber(normalizedPhone)) {
      throw new WhatsAppValidationError(`Invalid phone number: ${to}`)
    }

    // Validate button count
    if (buttons.length === 0) {
      throw new WhatsAppValidationError('At least one button is required')
    }
    if (buttons.length > MESSAGE_LIMITS.MAX_BUTTONS) {
      throw new WhatsAppValidationError(
        `Maximum ${MESSAGE_LIMITS.MAX_BUTTONS} buttons allowed`
      )
    }

    // Validate button titles
    for (const button of buttons) {
      if (button.title.length > MESSAGE_LIMITS.BUTTON_TITLE_MAX_LENGTH) {
        throw new WhatsAppValidationError(
          `Button title "${button.title}" exceeds ${MESSAGE_LIMITS.BUTTON_TITLE_MAX_LENGTH} characters`
        )
      }
      if (button.id.length > MESSAGE_LIMITS.BUTTON_ID_MAX_LENGTH) {
        throw new WhatsAppValidationError(
          `Button ID "${button.id}" exceeds ${MESSAGE_LIMITS.BUTTON_ID_MAX_LENGTH} characters`
        )
      }
    }

    return this.api.sendInteractiveButtons(normalizedPhone, body, buttons, options)
  }

  /**
   * Send interactive list with validation
   */
  async sendList(
    to: string,
    body: string,
    buttonText: string,
    sections: Array<{
      title?: string
      rows: Array<{ id: string; title: string; description?: string }>
    }>,
    options: { header?: string; footer?: string } = {}
  ): Promise<SendMessageResponse> {
    const normalizedPhone = normalizePhone(to)
    if (!isValidWhatsAppNumber(normalizedPhone)) {
      throw new WhatsAppValidationError(`Invalid phone number: ${to}`)
    }

    // Validate sections
    if (sections.length === 0) {
      throw new WhatsAppValidationError('At least one section is required')
    }
    if (sections.length > MESSAGE_LIMITS.MAX_LIST_SECTIONS) {
      throw new WhatsAppValidationError(
        `Maximum ${MESSAGE_LIMITS.MAX_LIST_SECTIONS} sections allowed`
      )
    }

    // Validate each section
    for (const section of sections) {
      if (section.rows.length === 0) {
        throw new WhatsAppValidationError('Each section must have at least one row')
      }
      if (section.rows.length > MESSAGE_LIMITS.MAX_LIST_ROWS_PER_SECTION) {
        throw new WhatsAppValidationError(
          `Maximum ${MESSAGE_LIMITS.MAX_LIST_ROWS_PER_SECTION} rows per section allowed`
        )
      }

      if (section.title && section.title.length > MESSAGE_LIMITS.LIST_SECTION_TITLE_MAX_LENGTH) {
        throw new WhatsAppValidationError(
          `Section title exceeds ${MESSAGE_LIMITS.LIST_SECTION_TITLE_MAX_LENGTH} characters`
        )
      }

      for (const row of section.rows) {
        if (row.title.length > MESSAGE_LIMITS.LIST_ROW_TITLE_MAX_LENGTH) {
          throw new WhatsAppValidationError(
            `Row title "${row.title}" exceeds ${MESSAGE_LIMITS.LIST_ROW_TITLE_MAX_LENGTH} characters`
          )
        }
        if (row.description && row.description.length > MESSAGE_LIMITS.LIST_ROW_DESCRIPTION_MAX_LENGTH) {
          throw new WhatsAppValidationError(
            `Row description exceeds ${MESSAGE_LIMITS.LIST_ROW_DESCRIPTION_MAX_LENGTH} characters`
          )
        }
      }
    }

    return this.api.sendInteractiveList(normalizedPhone, body, buttonText, sections, options)
  }

  /**
   * Send template message with validation
   */
  async sendTemplate(
    to: string,
    templateName: string,
    language: string = 'en',
    parameters?: {
      header?: string[]
      body?: string[]
      buttons?: Array<{ type: 'quick_reply' | 'url'; text: string }>
    }
  ): Promise<SendMessageResponse> {
    const normalizedPhone = normalizePhone(to)
    if (!isValidWhatsAppNumber(normalizedPhone)) {
      throw new WhatsAppValidationError(`Invalid phone number: ${to}`)
    }

    // Build components
    const components: Array<{
      type: 'header' | 'body' | 'button'
      sub_type?: 'quick_reply' | 'url'
      index?: number
      parameters?: Array<{ type: 'text'; text: string }>
    }> = []

    if (parameters?.header?.length) {
      components.push({
        type: 'header',
        parameters: parameters.header.map((text) => ({ type: 'text', text })),
      })
    }

    if (parameters?.body?.length) {
      components.push({
        type: 'body',
        parameters: parameters.body.map((text) => ({ type: 'text', text })),
      })
    }

    if (parameters?.buttons?.length) {
      parameters.buttons.forEach((button, index) => {
        components.push({
          type: 'button',
          sub_type: button.type,
          index,
          parameters: [{ type: 'text', text: button.text }],
        })
      })
    }

    return this.api.sendTemplate(
      normalizedPhone,
      templateName,
      language,
      components.length > 0 ? components : undefined
    )
  }

  /**
   * Send bulk messages
   */
  async sendBulk(
    phones: string[],
    message: string | ((phone: string) => string),
    options: {
      delayMs?: number
      onProgress?: (completed: number, total: number) => void
    } = {}
  ): Promise<BulkMessageResult[]> {
    const results: BulkMessageResult[] = []
    const { delayMs = 100, onProgress } = options

    for (let i = 0; i < phones.length; i++) {
      const phone = phones[i]
      const text = typeof message === 'function' ? message(phone) : message

      try {
        const response = await this.sendText(phone, text)
        results.push({
          phone,
          success: true,
          messageId: response.messages[0]?.id,
          waId: response.contacts[0]?.wa_id,
        })
      } catch (error) {
        results.push({
          phone,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      // Progress callback
      if (onProgress) {
        onProgress(i + 1, phones.length)
      }

      // Rate limiting delay
      if (i < phones.length - 1 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    return results
  }

  /**
   * Split text into chunks for long messages
   */
  private splitText(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text]
    }

    const chunks: string[] = []
    let remaining = text

    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining)
        break
      }

      // Try to split at a sentence boundary
      let splitIndex = remaining.lastIndexOf('. ', maxLength)
      if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
        // Try splitting at a word boundary
        splitIndex = remaining.lastIndexOf(' ', maxLength)
      }
      if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
        // Force split at maxLength
        splitIndex = maxLength
      }

      chunks.push(remaining.substring(0, splitIndex + 1).trim())
      remaining = remaining.substring(splitIndex + 1).trim()
    }

    return chunks
  }
}

export default MessageService
