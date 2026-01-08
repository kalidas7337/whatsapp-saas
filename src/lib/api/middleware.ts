/**
 * API Middleware
 * PROMPT 32: External Webhooks & Public API System
 *
 * Authentication, rate limiting, and request logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import type {
  APIContext,
  APIScope,
  APIResponse,
  RateLimitInfo,
  RateLimitRecord,
  ValidateAPIKeyResult,
} from './types'

// ============================================================================
// Rate Limit Store (In production, use Redis)
// ============================================================================

const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Every minute

// ============================================================================
// API Key Validation
// ============================================================================

/**
 * Validate API key and extract context
 */
export async function validateAPIKey(
  request: NextRequest
): Promise<ValidateAPIKeyResult> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      context: null,
      error: {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header. Use: Bearer <api_key>',
        },
      },
    }
  }

  const apiKey = authHeader.substring(7)
  const keyHash = hashAPIKey(apiKey)

  try {
    const key = await prisma.api_keys.findFirst({
      where: {
        key_hash: keyHash,
        is_active: true,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
    })

    if (!key) {
      return {
        context: null,
        error: {
          success: false,
          error: {
            code: 'INVALID_API_KEY',
            message: 'Invalid or expired API key',
          },
        },
      }
    }

    // Update last used timestamp (async, don't wait)
    prisma.api_keys
      .update({
        where: { id: key.id },
        data: { last_used_at: new Date() },
      })
      .catch(() => {
        // Silent fail for timestamp update
      })

    return {
      context: {
        organizationId: key.organization_id,
        apiKeyId: key.id,
        scopes: (key.scopes as APIScope[]) || [],
      },
      error: null,
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return {
      context: null,
      error: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate API key',
        },
      },
    }
  }
}

// ============================================================================
// Scope Checking
// ============================================================================

/**
 * Check if context has required scope
 */
export function hasScope(context: APIContext, scope: APIScope): boolean {
  return context.scopes.includes(scope)
}

/**
 * Require scope - returns error response if missing
 */
export function requireScope(scope: APIScope) {
  return (context: APIContext): APIResponse | null => {
    if (!hasScope(context, scope)) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Missing required scope: ${scope}`,
        },
      }
    }
    return null
  }
}

/**
 * Require any of the provided scopes
 */
export function requireAnyScope(scopes: APIScope[]) {
  return (context: APIContext): APIResponse | null => {
    const hasAny = scopes.some((scope) => hasScope(context, scope))
    if (!hasAny) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Missing required scope. Need one of: ${scopes.join(', ')}`,
        },
      }
    }
    return null
  }
}

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * Check rate limit for API key
 */
export function checkRateLimit(
  apiKeyId: string,
  limit = 100,
  windowMs = 60000
): { allowed: boolean; info: RateLimitInfo } {
  const now = Date.now()

  let record = rateLimitStore.get(apiKeyId)

  if (!record || record.resetAt < now) {
    record = { count: 0, resetAt: now + windowMs }
    rateLimitStore.set(apiKeyId, record)
  }

  record.count++

  const info: RateLimitInfo = {
    limit,
    remaining: Math.max(0, limit - record.count),
    reset: Math.ceil(record.resetAt / 1000),
  }

  return {
    allowed: record.count <= limit,
    info,
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  info: RateLimitInfo
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(info.limit))
  response.headers.set('X-RateLimit-Remaining', String(info.remaining))
  response.headers.set('X-RateLimit-Reset', String(info.reset))
  return response
}

// ============================================================================
// API Key Generation
// ============================================================================

/**
 * Hash API key for storage
 */
export function hashAPIKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Generate new API key
 */
export function generateAPIKey(): { key: string; prefix: string } {
  const prefix = 'wab_' + generateRandomString(4)
  const secret = generateRandomString(32)
  const key = `${prefix}_${secret}`
  return { key, prefix }
}

/**
 * Generate webhook secret
 */
export function generateWebhookSecret(): string {
  return 'whsec_' + generateRandomString(32)
}

/**
 * Generate random string
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

// ============================================================================
// Webhook Signatures
// ============================================================================

/**
 * Sign webhook payload
 */
export function signWebhookPayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${payload}`
  const signature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')
  return `t=${timestamp},v1=${signature}`
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance = 300 // 5 minutes
): boolean {
  try {
    const parts = signature.split(',').reduce(
      (acc, part) => {
        const [key, value] = part.split('=')
        acc[key] = value
        return acc
      },
      {} as Record<string, string>
    )

    const timestamp = parseInt(parts.t, 10)
    const expectedSig = parts.v1

    // Check timestamp
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - timestamp) > tolerance) {
      return false
    }

    // Verify signature
    const signedPayload = `${timestamp}.${payload}`
    const computedSig = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex')

    return computedSig === expectedSig
  } catch {
    return false
  }
}

// ============================================================================
// API Request Logging
// ============================================================================

/**
 * Log API request
 */
export async function logAPIRequest(
  context: APIContext,
  request: NextRequest,
  statusCode: number,
  responseTime: number
): Promise<void> {
  try {
    await prisma.api_logs.create({
      data: {
        organization_id: context.organizationId,
        api_key_id: context.apiKeyId,
        method: request.method,
        path: new URL(request.url).pathname,
        status_code: statusCode,
        response_time_ms: responseTime,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      },
    })
  } catch {
    // Silent fail for logging
  }
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  meta?: { page?: number; limit?: number; total?: number; hasMore?: boolean }
): APIResponse<T> {
  return {
    success: true,
    data,
    meta,
  }
}

/**
 * Create error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: unknown
): APIResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  }
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): APIResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      hasMore: page * limit < total,
    },
  }
}
