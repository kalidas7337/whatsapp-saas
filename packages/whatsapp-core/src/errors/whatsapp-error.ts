/**
 * WhatsApp Error Classes
 *
 * Comprehensive error handling for WhatsApp Cloud API
 */

import { META_ERROR_CODES, RETRYABLE_ERROR_CODES } from '../constants'
import type { MetaApiError } from '../types/api.types'
import type { WhatsAppErrorMeta, WhatsAppErrorCode, SerializedWhatsAppError } from '../types/error.types'

/**
 * Base WhatsApp Error class
 */
export class WhatsAppError extends Error {
  public readonly code: WhatsAppErrorCode | string
  public readonly httpStatus: number
  public readonly meta: WhatsAppErrorMeta

  constructor(
    message: string,
    code: WhatsAppErrorCode | string,
    httpStatus: number = 500,
    meta: WhatsAppErrorMeta = {}
  ) {
    super(message)
    this.name = 'WhatsAppError'
    this.code = code
    this.httpStatus = httpStatus
    this.meta = {
      ...meta,
      retryable: meta.retryable ?? this.isRetryable(httpStatus, code),
    }

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Determine if error is retryable based on status and code
   */
  private isRetryable(status: number, code: string): boolean {
    return RETRYABLE_ERROR_CODES.includes(status) || code === 'RATE_LIMIT_EXCEEDED'
  }

  /**
   * Create from Meta API error response
   */
  static fromMetaApiError(error: MetaApiError, httpStatus: number = 400): WhatsAppError {
    const code = mapMetaErrorToCode(error.code, error.error_subcode)
    const retryable = error.code === META_ERROR_CODES.RATE_LIMIT_HIT

    return new WhatsAppError(error.message, code, httpStatus, {
      retryable,
      originalError: error,
    })
  }

  /**
   * Serialize error for JSON transport
   */
  toJSON(): SerializedWhatsAppError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      httpStatus: this.httpStatus,
      meta: this.meta,
      stack: this.stack,
    }
  }

  /**
   * Check if error is of specific type
   */
  isType(code: WhatsAppErrorCode | string): boolean {
    return this.code === code
  }
}

/**
 * Authentication error (invalid/expired token)
 */
export class WhatsAppAuthError extends WhatsAppError {
  constructor(message: string = 'Authentication failed', meta?: WhatsAppErrorMeta) {
    super(message, 'AUTH_ERROR', 401, { ...meta, retryable: false })
    this.name = 'WhatsAppAuthError'
  }
}

/**
 * Rate limit exceeded error
 */
export class WhatsAppRateLimitError extends WhatsAppError {
  constructor(retryAfter?: number, meta?: WhatsAppErrorMeta) {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429, {
      ...meta,
      retryable: true,
      retryAfter: retryAfter ?? 60,
    })
    this.name = 'WhatsAppRateLimitError'
  }
}

/**
 * Validation error (invalid request data)
 */
export class WhatsAppValidationError extends WhatsAppError {
  constructor(message: string, meta?: WhatsAppErrorMeta) {
    super(message, 'VALIDATION_ERROR', 400, { ...meta, retryable: false })
    this.name = 'WhatsAppValidationError'
  }
}

/**
 * Recipient error (user not on WhatsApp, blocked, etc.)
 */
export class WhatsAppRecipientError extends WhatsAppError {
  constructor(message: string, meta?: WhatsAppErrorMeta) {
    super(message, 'RECIPIENT_ERROR', 400, { ...meta, retryable: false })
    this.name = 'WhatsAppRecipientError'
  }
}

/**
 * Template error (not found, param mismatch, etc.)
 */
export class WhatsAppTemplateError extends WhatsAppError {
  constructor(
    message: string,
    code: 'TEMPLATE_ERROR' | 'TEMPLATE_NOT_FOUND' | 'TEMPLATE_PARAM_MISMATCH' | 'TEMPLATE_PAUSED' = 'TEMPLATE_ERROR',
    meta?: WhatsAppErrorMeta
  ) {
    super(message, code, 400, { ...meta, retryable: false })
    this.name = 'WhatsAppTemplateError'
  }
}

/**
 * Media error (upload/download failed)
 */
export class WhatsAppMediaError extends WhatsAppError {
  constructor(
    message: string,
    code: 'MEDIA_ERROR' | 'MEDIA_DOWNLOAD_ERROR' | 'MEDIA_UPLOAD_ERROR' = 'MEDIA_ERROR',
    meta?: WhatsAppErrorMeta
  ) {
    super(message, code, 400, meta)
    this.name = 'WhatsAppMediaError'
  }
}

/**
 * 24-hour window error
 */
export class WhatsAppWindowError extends WhatsAppError {
  constructor(meta?: WhatsAppErrorMeta) {
    super(
      '24-hour messaging window has closed. Use a template message.',
      'OUTSIDE_24H_WINDOW',
      400,
      { ...meta, retryable: false }
    )
    this.name = 'WhatsAppWindowError'
  }
}

/**
 * Network/timeout error
 */
export class WhatsAppNetworkError extends WhatsAppError {
  constructor(message: string = 'Network error', meta?: WhatsAppErrorMeta) {
    super(message, 'NETWORK_ERROR', 500, { ...meta, retryable: true })
    this.name = 'WhatsAppNetworkError'
  }
}

/**
 * Timeout error
 */
export class WhatsAppTimeoutError extends WhatsAppError {
  constructor(message: string = 'Request timeout', meta?: WhatsAppErrorMeta) {
    super(message, 'TIMEOUT', 408, { ...meta, retryable: true })
    this.name = 'WhatsAppTimeoutError'
  }
}

/**
 * Map Meta error codes to our error codes
 */
function mapMetaErrorToCode(code: number, subcode?: number): WhatsAppErrorCode {
  switch (code) {
    case META_ERROR_CODES.ACCESS_TOKEN_EXPIRED:
    case META_ERROR_CODES.INVALID_ACCESS_TOKEN:
      return 'AUTH_ERROR'

    case META_ERROR_CODES.RATE_LIMIT_HIT:
    case META_ERROR_CODES.RATE_LIMIT_SPIKE_LIMIT:
    case META_ERROR_CODES.RATE_LIMIT_PAIR_LIMIT:
      return 'RATE_LIMIT_EXCEEDED'

    case META_ERROR_CODES.RECIPIENT_NOT_ON_WHATSAPP:
    case META_ERROR_CODES.PHONE_NUMBER_NOT_FOUND:
      return 'RECIPIENT_NOT_ON_WHATSAPP'

    case META_ERROR_CODES.TEMPLATE_NOT_FOUND:
      return 'TEMPLATE_NOT_FOUND'
    case META_ERROR_CODES.TEMPLATE_PARAM_MISMATCH:
      return 'TEMPLATE_PARAM_MISMATCH'
    case META_ERROR_CODES.TEMPLATE_PAUSED:
      return 'TEMPLATE_PAUSED'

    case META_ERROR_CODES.OUTSIDE_24H_WINDOW:
      return 'OUTSIDE_24H_WINDOW'

    case META_ERROR_CODES.MEDIA_UPLOAD_ERROR:
      return 'MEDIA_UPLOAD_ERROR'
    case META_ERROR_CODES.MEDIA_DOWNLOAD_ERROR:
      return 'MEDIA_DOWNLOAD_ERROR'

    default:
      return subcode ? `META_ERROR_${code}_${subcode}` : `META_ERROR_${code}`
  }
}

/**
 * Type guard to check if error is a WhatsApp error
 */
export function isWhatsAppError(error: unknown): error is WhatsAppError {
  return error instanceof WhatsAppError
}

/**
 * Type guard to check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof WhatsAppError) {
    return error.meta.retryable === true
  }

  if (error instanceof Error && 'status' in error) {
    const status = (error as Error & { status: number }).status
    return RETRYABLE_ERROR_CODES.includes(status)
  }

  // Retry on network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }

  return false
}
