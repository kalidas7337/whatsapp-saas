/**
 * WhatsApp Cloud API Service
 *
 * Production-grade client for Meta WhatsApp Cloud API
 * Handles all outbound message sending and API operations
 */

import {
  WhatsAppCredentials,
  SendMessageResponse,
  MetaApiResponse,
  MetaApiError,
  BusinessProfile,
  PhoneNumberInfo,
  MediaInfo,
  UploadMediaResponse,
  TemplatesListResponse,
  TemplateInfo,
} from '../types/api.types'
import {
  MessagePayload,
  TemplateMessagePayload,
  TemplateComponentPayload,
  InteractiveButton,
  InteractiveListSection,
} from '../types/message.types'
import { WHATSAPP_API_VERSION, WHATSAPP_BASE_URL, TIMEOUTS } from '../constants'
import {
  WhatsAppError,
  WhatsAppAuthError,
  WhatsAppRateLimitError,
  WhatsAppTimeoutError,
  WhatsAppNetworkError,
} from '../errors/whatsapp-error'
import { withRetry, RetryOptions } from '../utils/retry.utils'
import { maskPhone } from '../utils/phone.utils'

/**
 * Logger interface for structured logging
 */
export interface Logger {
  debug: (message: string, meta?: object) => void
  info: (message: string, meta?: object) => void
  warn: (message: string, meta?: object) => void
  error: (message: string, meta?: object) => void
}

/**
 * Cloud API service configuration
 */
export interface CloudApiServiceConfig {
  /** WhatsApp API credentials */
  credentials: WhatsAppCredentials
  /** Request timeout in milliseconds */
  timeout?: number
  /** Custom logger */
  logger?: Logger
  /** Retry options */
  retryOptions?: RetryOptions
}

/**
 * Default console logger
 */
const defaultLogger: Logger = {
  debug: (msg, meta) => console.debug(`[WHATSAPP] ${msg}`, meta || ''),
  info: (msg, meta) => console.log(`[WHATSAPP] ${msg}`, meta || ''),
  warn: (msg, meta) => console.warn(`[WHATSAPP] ${msg}`, meta || ''),
  error: (msg, meta) => console.error(`[WHATSAPP] ${msg}`, meta || ''),
}

/**
 * WhatsApp Cloud API Service
 *
 * @example
 * ```typescript
 * const api = new WhatsAppCloudApiService({
 *   credentials: {
 *     phoneNumberId: 'your-phone-number-id',
 *     accessToken: 'your-access-token',
 *     wabaId: 'your-waba-id'
 *   }
 * })
 *
 * await api.sendText('+919876543210', 'Hello from WhatsApp!')
 * ```
 */
export class WhatsAppCloudApiService {
  private readonly phoneNumberId: string
  private readonly accessToken: string
  private readonly wabaId: string
  private readonly apiVersion: string
  private readonly timeout: number
  private readonly logger: Logger
  private readonly retryOptions: RetryOptions

  constructor(config: CloudApiServiceConfig) {
    this.phoneNumberId = config.credentials.phoneNumberId
    this.accessToken = config.credentials.accessToken
    this.wabaId = config.credentials.wabaId
    this.apiVersion = config.credentials.apiVersion || WHATSAPP_API_VERSION
    this.timeout = config.timeout || TIMEOUTS.API_REQUEST
    this.logger = config.logger || defaultLogger
    this.retryOptions = config.retryOptions || {}
  }

  // ============================================================
  // BASE REQUEST METHOD
  // ============================================================

  /**
   * Make an API request to Meta Graph API
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: object,
    options: { timeout?: number; skipRetry?: boolean } = {}
  ): Promise<T> {
    const url = `${WHATSAPP_BASE_URL}/${this.apiVersion}/${endpoint}`
    const timeout = options.timeout || this.timeout

    const makeRequest = async (): Promise<T> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        this.logger.debug(`${method} ${endpoint}`, {
          body: body ? this.sanitizeForLog(body) : undefined,
        })

        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const data = (await response.json()) as MetaApiResponse<T>

        // Handle errors
        if (!response.ok || data.error) {
          throw this.handleApiError(response.status, data.error)
        }

        this.logger.debug(`Response ${response.status}`, {
          endpoint,
          status: response.status,
        })

        return data as T
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof WhatsAppError) {
          throw error
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new WhatsAppTimeoutError()
          }
          throw new WhatsAppNetworkError(error.message, {
            originalError: error,
          })
        }

        throw error
      }
    }

    if (options.skipRetry) {
      return makeRequest()
    }

    return withRetry(makeRequest, {
      ...this.retryOptions,
      onRetry: (error, attempt, delayMs) => {
        this.logger.warn(`Retrying request (attempt ${attempt})`, {
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error',
          delayMs,
        })
      },
    })
  }

  /**
   * Handle API error responses
   */
  private handleApiError(status: number, error?: MetaApiError): WhatsAppError {
    if (!error) {
      return new WhatsAppError('Unknown API error', 'UNKNOWN_ERROR', status)
    }

    this.logger.error('API error', {
      status,
      code: error.code,
      subcode: error.error_subcode,
      message: error.message,
    })

    // Handle specific error codes
    if (error.code === 190 || error.code === 191) {
      return new WhatsAppAuthError(error.message)
    }

    if (error.code === 130429 || status === 429) {
      return new WhatsAppRateLimitError()
    }

    return WhatsAppError.fromMetaApiError(error, status)
  }

  /**
   * Sanitize request body for logging
   */
  private sanitizeForLog(obj: object): object {
    const sanitized = { ...obj } as Record<string, unknown>
    // Remove sensitive data from logs
    if (sanitized.access_token) sanitized.access_token = '[REDACTED]'
    if (typeof sanitized.to === 'string') sanitized.to = maskPhone(sanitized.to)
    return sanitized
  }

  // ============================================================
  // MESSAGE SENDING
  // ============================================================

  /**
   * Send any type of message
   */
  async sendMessage(payload: MessagePayload): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>(
      'POST',
      `${this.phoneNumberId}/messages`,
      payload
    )
  }

  /**
   * Send a text message
   *
   * @param to - Recipient phone number in E.164 format
   * @param text - Message text (max 4096 characters)
   * @param options - Additional options
   */
  async sendText(
    to: string,
    text: string,
    options: { previewUrl?: boolean; replyTo?: string } = {}
  ): Promise<SendMessageResponse> {
    const payload: MessagePayload & { context?: { message_id: string } } = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: options.previewUrl || false,
        body: text,
      },
    }

    if (options.replyTo) {
      payload.context = { message_id: options.replyTo }
    }

    return this.sendMessage(payload as MessagePayload)
  }

  /**
   * Send a template message
   *
   * @param to - Recipient phone number
   * @param templateName - Template name
   * @param language - Language code (default 'en')
   * @param components - Template components with parameters
   */
  async sendTemplate(
    to: string,
    templateName: string,
    language: string = 'en',
    components?: TemplateComponentPayload[]
  ): Promise<SendMessageResponse> {
    const payload: TemplateMessagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components,
      },
    }

    return this.sendMessage(payload)
  }

  /**
   * Send an image message
   */
  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption,
      },
    })
  }

  /**
   * Send an image message with media ID
   */
  async sendImageById(
    to: string,
    mediaId: string,
    caption?: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        id: mediaId,
        caption,
      },
    })
  }

  /**
   * Send a video message
   */
  async sendVideo(
    to: string,
    videoUrl: string,
    caption?: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'video',
      video: {
        link: videoUrl,
        caption,
      },
    })
  }

  /**
   * Send a document message
   */
  async sendDocument(
    to: string,
    documentUrl: string,
    filename?: string,
    caption?: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        caption,
      },
    })
  }

  /**
   * Send an audio message
   */
  async sendAudio(to: string, audioUrl: string): Promise<SendMessageResponse> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'audio',
      audio: {
        link: audioUrl,
      },
    })
  }

  /**
   * Send a location message
   */
  async sendLocation(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'location',
      location: {
        latitude,
        longitude,
        name,
        address,
      },
    })
  }

  /**
   * Send interactive buttons (max 3 buttons)
   */
  async sendInteractiveButtons(
    to: string,
    body: string,
    buttons: Array<{ id: string; title: string }>,
    options: { header?: string; footer?: string } = {}
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: options.header ? { type: 'text', text: options.header } : undefined,
        body: { text: body },
        footer: options.footer ? { text: options.footer } : undefined,
        action: {
          buttons: buttons.map((b) => ({
            type: 'reply' as const,
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    })
  }

  /**
   * Send interactive list menu
   */
  async sendInteractiveList(
    to: string,
    body: string,
    buttonText: string,
    sections: Array<{
      title?: string
      rows: Array<{ id: string; title: string; description?: string }>
    }>,
    options: { header?: string; footer?: string } = {}
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: options.header ? { type: 'text', text: options.header } : undefined,
        body: { text: body },
        footer: options.footer ? { text: options.footer } : undefined,
        action: {
          button: buttonText,
          sections,
        },
      },
    })
  }

  /**
   * Send a reaction to a message
   */
  async sendReaction(
    to: string,
    messageId: string,
    emoji: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'reaction',
      reaction: {
        message_id: messageId,
        emoji,
      },
    })
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(to: string, messageId: string): Promise<SendMessageResponse> {
    return this.sendReaction(to, messageId, '')
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    return this.request('POST', `${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    })
  }

  // ============================================================
  // MEDIA OPERATIONS
  // ============================================================

  /**
   * Get media URL from media ID
   */
  async getMediaUrl(mediaId: string): Promise<MediaInfo> {
    return this.request<MediaInfo>('GET', mediaId)
  }

  /**
   * Download media file
   */
  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.MEDIA_DOWNLOAD)

    try {
      const response = await fetch(mediaUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new WhatsAppError(
          `Failed to download media: ${response.status}`,
          'MEDIA_DOWNLOAD_ERROR',
          response.status
        )
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof WhatsAppError) throw error
      throw new WhatsAppError('Media download failed', 'MEDIA_DOWNLOAD_ERROR', 500, {
        originalError: error,
      })
    }
  }

  /**
   * Upload media file
   */
  async uploadMedia(
    file: Buffer | Blob,
    mimeType: string,
    filename?: string
  ): Promise<UploadMediaResponse> {
    const formData = new FormData()

    // Create blob from file data
    let blob: Blob
    if (Buffer.isBuffer(file)) {
      // Convert Buffer to Blob - use Array.from for compatibility
      blob = new Blob([new Uint8Array(Array.from(file))], { type: mimeType })
    } else {
      blob = file as Blob
    }
    formData.append('file', blob, filename || 'file')

    formData.append('messaging_product', 'whatsapp')
    formData.append('type', mimeType)

    const url = `${WHATSAPP_BASE_URL}/${this.apiVersion}/${this.phoneNumberId}/media`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.MEDIA_UPLOAD)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = (await response.json()) as { id?: string; error?: MetaApiError }

      if (!response.ok || data.error) {
        throw this.handleApiError(response.status, data.error)
      }

      return data as UploadMediaResponse
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof WhatsAppError) throw error
      throw new WhatsAppError('Media upload failed', 'MEDIA_UPLOAD_ERROR', 500, {
        originalError: error,
      })
    }
  }

  /**
   * Delete uploaded media
   */
  async deleteMedia(mediaId: string): Promise<{ success: boolean }> {
    return this.request('DELETE', mediaId)
  }

  // ============================================================
  // ACCOUNT OPERATIONS
  // ============================================================

  /**
   * Get business profile
   */
  async getBusinessProfile(): Promise<BusinessProfile> {
    const response = await this.request<{ data: BusinessProfile[] }>(
      'GET',
      `${this.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`
    )
    return response.data[0]
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(
    profile: Partial<Omit<BusinessProfile, 'messaging_product'>>
  ): Promise<{ success: boolean }> {
    return this.request('POST', `${this.phoneNumberId}/whatsapp_business_profile`, {
      messaging_product: 'whatsapp',
      ...profile,
    })
  }

  /**
   * Get phone number info
   */
  async getPhoneNumberInfo(): Promise<PhoneNumberInfo> {
    return this.request(
      'GET',
      `${this.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,messaging_limit_tier,platform_type,throughput`
    )
  }

  // ============================================================
  // TEMPLATE OPERATIONS
  // ============================================================

  /**
   * Get all message templates
   */
  async getMessageTemplates(
    options: {
      limit?: number
      after?: string
      status?: string
    } = {}
  ): Promise<TemplatesListResponse> {
    const params = new URLSearchParams({
      fields: 'name,language,status,category,components,quality_score',
      limit: String(options.limit || 100),
    })

    if (options.after) params.append('after', options.after)
    if (options.status) params.append('status', options.status)

    return this.request('GET', `${this.wabaId}/message_templates?${params}`)
  }

  /**
   * Get a specific template by name
   */
  async getTemplateByName(name: string): Promise<TemplateInfo | null> {
    const response = await this.getMessageTemplates()
    return response.data.find((t) => t.name === name) || null
  }

  /**
   * Delete a message template
   */
  async deleteTemplate(templateName: string): Promise<{ success: boolean }> {
    return this.request(
      'DELETE',
      `${this.wabaId}/message_templates?name=${encodeURIComponent(templateName)}`
    )
  }

  // ============================================================
  // STATIC METHODS
  // ============================================================

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string | null,
    appSecret: string
  ): boolean {
    // Import dynamically to avoid circular dependency
    const { verifyWebhookSignature } = require('../utils/signature.utils')
    return verifyWebhookSignature(payload, signature, appSecret)
  }

  /**
   * Create service instance from credentials
   */
  static create(credentials: WhatsAppCredentials, options?: Omit<CloudApiServiceConfig, 'credentials'>): WhatsAppCloudApiService {
    return new WhatsAppCloudApiService({
      credentials,
      ...options,
    })
  }
}

export default WhatsAppCloudApiService
