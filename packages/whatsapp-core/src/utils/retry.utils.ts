/**
 * Retry Utilities
 *
 * Exponential backoff and retry logic for API calls
 */

import { RETRY_CONFIG, RETRYABLE_ERROR_CODES } from '../constants'
import { WhatsAppError, WhatsAppRateLimitError, isRetryableError } from '../errors/whatsapp-error'

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Initial delay in milliseconds before first retry */
  initialDelayMs?: number
  /** Maximum delay in milliseconds between retries */
  maxDelayMs?: number
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number
  /** Custom function to determine if error should be retried */
  shouldRetry?: (error: unknown, attempt: number) => boolean
  /** Callback when a retry is about to happen */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void
  /** Callback after all attempts failed */
  onAllFailed?: (error: unknown, attempts: number) => void
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt - 1)
  // Add 0-30% jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * exponentialDelay
  const delay = Math.min(exponentialDelay + jitter, maxDelay)
  return Math.round(delay)
}

/**
 * Default retry condition
 */
export function defaultShouldRetry(error: unknown, _attempt: number): boolean {
  return isRetryableError(error)
}

/**
 * Execute function with retry logic
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => api.sendMessage(payload),
 *   {
 *     maxRetries: 3,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry ${attempt} in ${delay}ms`)
 *     }
 *   }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    initialDelayMs = RETRY_CONFIG.INITIAL_DELAY_MS,
    maxDelayMs = RETRY_CONFIG.MAX_DELAY_MS,
    backoffMultiplier = RETRY_CONFIG.BACKOFF_MULTIPLIER,
    shouldRetry = defaultShouldRetry,
    onRetry,
    onAllFailed,
  } = options

  let lastError: unknown
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      attempt++

      // Check if we should retry
      if (attempt > maxRetries || !shouldRetry(error, attempt)) {
        if (onAllFailed) {
          onAllFailed(error, attempt)
        }
        throw error
      }

      // Calculate delay
      let delayMs: number

      if (error instanceof WhatsAppRateLimitError && error.meta.retryAfter) {
        // Use retry-after from rate limit response
        delayMs = error.meta.retryAfter * 1000
      } else {
        delayMs = calculateBackoffDelay(attempt, initialDelayMs, maxDelayMs, backoffMultiplier)
      }

      // Notify about retry
      if (onRetry) {
        onRetry(error, attempt, delayMs)
      }

      // Wait before retry
      await sleep(delayMs)
    }
  }

  throw lastError
}

/**
 * Create a retry wrapper with preset options
 *
 * @example
 * ```typescript
 * const retryableApiCall = createRetrier({ maxRetries: 5 })
 * const result = await retryableApiCall(() => api.getData())
 * ```
 */
export function createRetrier(defaultOptions: RetryOptions = {}) {
  return function <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    return withRetry(fn, { ...defaultOptions, ...options })
  }
}

/**
 * Execute multiple async functions with retry logic for each
 * Stops on first success
 *
 * @example
 * ```typescript
 * const result = await withFallback([
 *   () => primaryApi.sendMessage(payload),
 *   () => backupApi.sendMessage(payload),
 * ])
 * ```
 */
export async function withFallback<T>(
  fns: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T> {
  const errors: unknown[] = []

  for (const fn of fns) {
    try {
      return await withRetry(fn, options)
    } catch (error) {
      errors.push(error)
    }
  }

  // All fallbacks failed
  const lastError = errors[errors.length - 1]
  if (lastError instanceof Error) {
    throw lastError
  }
  throw new Error('All fallback attempts failed')
}

/**
 * Batch process items with retry logic and concurrency control
 *
 * @example
 * ```typescript
 * const results = await batchWithRetry(
 *   phoneNumbers,
 *   (phone) => api.sendMessage(phone, message),
 *   { concurrency: 5 }
 * )
 * ```
 */
export async function batchWithRetry<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: RetryOptions & { concurrency?: number } = {}
): Promise<Array<{ item: T; result?: R; error?: unknown }>> {
  const { concurrency = 10, ...retryOptions } = options
  const results: Array<{ item: T; result?: R; error?: unknown }> = []

  // Process in chunks for concurrency control
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency)

    const chunkResults = await Promise.all(
      chunk.map(async (item, chunkIndex) => {
        const index = i + chunkIndex
        try {
          const result = await withRetry(() => fn(item, index), retryOptions)
          return { item, result }
        } catch (error) {
          return { item, error }
        }
      })
    )

    results.push(...chunkResults)
  }

  return results
}

/**
 * Circuit breaker for API calls
 * Stops trying after too many failures in a time window
 */
export class CircuitBreaker {
  private failures: number[] = []
  private isOpen = false

  constructor(
    private readonly threshold: number = 5,
    private readonly windowMs: number = 60000,
    private readonly resetMs: number = 30000
  ) {}

  private cleanOldFailures(): void {
    const cutoff = Date.now() - this.windowMs
    this.failures = this.failures.filter((time) => time > cutoff)
  }

  recordFailure(): void {
    this.cleanOldFailures()
    this.failures.push(Date.now())

    if (this.failures.length >= this.threshold) {
      this.isOpen = true
      setTimeout(() => {
        this.isOpen = false
        this.failures = []
      }, this.resetMs)
    }
  }

  recordSuccess(): void {
    this.failures = []
  }

  isCircuitOpen(): boolean {
    return this.isOpen
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      throw new WhatsAppError(
        'Circuit breaker is open - too many failures',
        'RATE_LIMIT_EXCEEDED',
        503,
        { retryable: true, retryAfter: Math.ceil(this.resetMs / 1000) }
      )
    }

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }
}
