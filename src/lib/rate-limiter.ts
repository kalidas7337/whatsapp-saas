/**
 * Production-Ready Rate Limiter
 *
 * Supports both Redis (production) and in-memory (development) rate limiting.
 * Uses sliding window algorithm for accurate rate limiting.
 */

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number // Unix timestamp in seconds
}

export interface RateLimitResult {
  allowed: boolean
  info: RateLimitInfo
}

interface RateLimitRecord {
  count: number
  resetAt: number
}

// In-memory store for development/fallback
const memoryStore = new Map<string, RateLimitRecord>()

// Clean up old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of memoryStore.entries()) {
      if (record.resetAt < now) {
        memoryStore.delete(key)
      }
    }
  }, 60000) // Every minute
}

// Redis client singleton (lazy loaded)
let redisClient: import('ioredis').Redis | null = null
let redisInitialized = false
let redisError = false

async function getRedisClient(): Promise<import('ioredis').Redis | null> {
  if (redisInitialized) return redisClient
  redisInitialized = true

  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    console.log('[RATE LIMITER] REDIS_URL not configured, using in-memory rate limiting')
    return null
  }

  try {
    const Redis = (await import('ioredis')).default
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    })

    await redisClient.connect()

    redisClient.on('error', (err) => {
      console.error('[RATE LIMITER] Redis error:', err.message)
      redisError = true
    })

    redisClient.on('connect', () => {
      console.log('[RATE LIMITER] Redis connected')
      redisError = false
    })

    console.log('[RATE LIMITER] Redis rate limiting enabled')
    return redisClient
  } catch (error) {
    console.warn('[RATE LIMITER] Failed to connect to Redis, using in-memory fallback:', error)
    redisError = true
    return null
  }
}

/**
 * Check rate limit using Redis or in-memory fallback
 */
export async function checkRateLimitAsync(
  key: string,
  limit = 100,
  windowMs = 60000
): Promise<RateLimitResult> {
  const redis = await getRedisClient()

  // Use Redis if available and not in error state
  if (redis && !redisError) {
    return checkRateLimitRedis(redis, key, limit, windowMs)
  }

  // Fall back to in-memory
  return checkRateLimitMemory(key, limit, windowMs)
}

/**
 * Synchronous rate limit check (in-memory only)
 * Use this for non-async contexts
 */
export function checkRateLimitSync(
  key: string,
  limit = 100,
  windowMs = 60000
): RateLimitResult {
  return checkRateLimitMemory(key, limit, windowMs)
}

/**
 * Redis-based rate limiting using sliding window
 */
async function checkRateLimitRedis(
  redis: import('ioredis').Redis,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`
  const now = Date.now()
  const windowStart = now - windowMs

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline()

    // Remove old entries outside the window
    pipeline.zremrangebyscore(redisKey, 0, windowStart)

    // Add current request with current timestamp as score
    pipeline.zadd(redisKey, now.toString(), `${now}:${Math.random()}`)

    // Count entries in the window
    pipeline.zcard(redisKey)

    // Set expiry on the key
    pipeline.pexpire(redisKey, windowMs)

    const results = await pipeline.exec()

    // zcard result is at index 2
    const count = (results?.[2]?.[1] as number) || 0
    const resetAt = Math.ceil((now + windowMs) / 1000)

    return {
      allowed: count <= limit,
      info: {
        limit,
        remaining: Math.max(0, limit - count),
        reset: resetAt,
      },
    }
  } catch (error) {
    console.error('[RATE LIMITER] Redis error, falling back to memory:', error)
    redisError = true
    return checkRateLimitMemory(key, limit, windowMs)
  }
}

/**
 * In-memory rate limiting using fixed window
 */
function checkRateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()

  let record = memoryStore.get(key)

  if (!record || record.resetAt < now) {
    record = { count: 0, resetAt: now + windowMs }
    memoryStore.set(key, record)
  }

  record.count++

  return {
    allowed: record.count <= limit,
    info: {
      limit,
      remaining: Math.max(0, limit - record.count),
      reset: Math.ceil(record.resetAt / 1000),
    },
  }
}

/**
 * Create a rate limiter for a specific configuration
 */
export function createRateLimiter(config: {
  limit: number
  windowMs: number
  keyPrefix?: string
}) {
  const { limit, windowMs, keyPrefix = '' } = config

  return {
    async check(key: string): Promise<RateLimitResult> {
      const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key
      return checkRateLimitAsync(fullKey, limit, windowMs)
    },

    checkSync(key: string): RateLimitResult {
      const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key
      return checkRateLimitSync(fullKey, limit, windowMs)
    },
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // API rate limiter: 100 requests per minute per API key
  api: createRateLimiter({
    limit: 100,
    windowMs: 60 * 1000,
    keyPrefix: 'api',
  }),

  // Auth rate limiter: 5 login attempts per minute per IP
  auth: createRateLimiter({
    limit: 5,
    windowMs: 60 * 1000,
    keyPrefix: 'auth',
  }),

  // Message sending rate limiter: 30 messages per minute per account
  messageSend: createRateLimiter({
    limit: 30,
    windowMs: 60 * 1000,
    keyPrefix: 'msg',
  }),

  // Broadcast rate limiter: 5 broadcasts per hour per organization
  broadcast: createRateLimiter({
    limit: 5,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'broadcast',
  }),

  // Webhook rate limiter: 1000 webhooks per minute
  webhook: createRateLimiter({
    limit: 1000,
    windowMs: 60 * 1000,
    keyPrefix: 'webhook',
  }),
}

/**
 * Cleanup function for graceful shutdown
 */
export async function closeRateLimiter(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    redisInitialized = false
  }
}
