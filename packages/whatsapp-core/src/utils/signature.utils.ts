/**
 * Signature Utilities
 *
 * Webhook signature verification for Meta webhooks
 */

import { createHmac, timingSafeEqual, randomBytes } from 'crypto'

/**
 * Verify webhook signature from Meta
 *
 * @param payload - Raw request body as string
 * @param signature - X-Hub-Signature-256 header value
 * @param appSecret - WhatsApp App Secret
 * @returns true if signature is valid
 *
 * @example
 * ```typescript
 * app.post('/webhook', (req, res) => {
 *   const signature = req.headers['x-hub-signature-256']
 *   const isValid = verifyWebhookSignature(
 *     req.rawBody,
 *     signature,
 *     process.env.WHATSAPP_APP_SECRET
 *   )
 *   if (!isValid) {
 *     return res.status(401).send('Invalid signature')
 *   }
 *   // Process webhook...
 * })
 * ```
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null | undefined,
  appSecret: string
): boolean {
  if (!signature || !appSecret || !payload) {
    return false
  }

  try {
    const expectedSignature = createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex')

    const expected = `sha256=${expectedSignature}`

    // Use timing-safe comparison to prevent timing attacks
    if (signature.length !== expected.length) {
      return false
    }

    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch (error) {
    console.error('[WHATSAPP] Signature verification error:', error)
    return false
  }
}

/**
 * Generate a webhook verify token
 *
 * @param length - Length of the token (default 32)
 * @returns Random alphanumeric string
 *
 * @example
 * ```typescript
 * const verifyToken = generateVerifyToken()
 * // Store this token and use it when registering webhook
 * ```
 */
export function generateVerifyToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(length)
  let result = ''

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }

  return result
}

/**
 * Generate a random API key
 *
 * @param prefix - Prefix for the key (e.g., 'wa_' or 'wh_')
 * @returns Prefixed random key
 *
 * @example
 * ```typescript
 * const apiKey = generateApiKey('wa_')
 * // wa_k7HjL9x2mN4pQ8rS1tU6vW3y...
 * ```
 */
export function generateApiKey(prefix = 'wa_'): string {
  const key = randomBytes(32).toString('hex')
  return `${prefix}${key}`
}

/**
 * Hash an API key for secure storage
 *
 * @param apiKey - The API key to hash
 * @param salt - Optional salt (will be generated if not provided)
 * @returns Object with hash and salt
 *
 * @example
 * ```typescript
 * const { hash, salt } = hashApiKey(apiKey)
 * // Store hash and salt in database
 * ```
 */
export function hashApiKey(
  apiKey: string,
  salt?: string
): { hash: string; salt: string } {
  const useSalt = salt || randomBytes(16).toString('hex')
  const hash = createHmac('sha256', useSalt).update(apiKey).digest('hex')

  return { hash, salt: useSalt }
}

/**
 * Verify an API key against stored hash
 *
 * @param apiKey - The API key to verify
 * @param storedHash - The stored hash
 * @param salt - The salt used for hashing
 * @returns true if key matches
 */
export function verifyApiKey(apiKey: string, storedHash: string, salt: string): boolean {
  try {
    const { hash } = hashApiKey(apiKey, salt)

    if (hash.length !== storedHash.length) {
      return false
    }

    return timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash))
  } catch {
    return false
  }
}

/**
 * Extract and verify webhook verification request
 *
 * @param queryParams - URL query parameters
 * @param verifyToken - Your stored verify token
 * @returns Challenge string if verified, null if invalid
 *
 * @example
 * ```typescript
 * app.get('/webhook', (req, res) => {
 *   const challenge = verifyWebhookChallenge(
 *     req.query,
 *     process.env.WEBHOOK_VERIFY_TOKEN
 *   )
 *   if (challenge) {
 *     return res.send(challenge)
 *   }
 *   return res.status(403).send('Verification failed')
 * })
 * ```
 */
export function verifyWebhookChallenge(
  queryParams: Record<string, string | string[] | undefined>,
  verifyToken: string
): string | null {
  const mode = queryParams['hub.mode']
  const token = queryParams['hub.verify_token']
  const challenge = queryParams['hub.challenge']

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return Array.isArray(challenge) ? challenge[0] : challenge
  }

  return null
}

/**
 * Create a signed request for server-to-server calls
 *
 * @param payload - Request payload
 * @param secret - Shared secret
 * @returns Signature header value
 */
export function createRequestSignature(payload: object, secret: string): string {
  const body = JSON.stringify(payload)
  const signature = createHmac('sha256', secret).update(body).digest('hex')
  return `sha256=${signature}`
}
