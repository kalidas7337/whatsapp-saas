/**
 * Environment Configuration and Validation
 *
 * Validates required environment variables at startup
 * and provides typed access to configuration.
 */

import { z } from 'zod'

/**
 * Environment schema with validation
 */
const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('WhatsApp Business Platform'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // WhatsApp API
  WHATSAPP_API_VERSION: z.string().default('v18.0'),
  META_APP_SECRET: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),

  // Storage (optional)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_STARTER_YEARLY_PLAN_ID: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID: z.string().optional(),

  // AI (optional)
  OPENAI_API_KEY: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  JSON_LOGGING: z.string().optional(),
  SERVICE_NAME: z.string().default('whatsapp-saas'),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validated environment configuration
 */
let _env: Env | null = null

/**
 * Get validated environment configuration
 * Throws if required variables are missing
 */
export function getEnv(): Env {
  if (_env) return _env

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`)
    console.error('Environment validation failed:')
    console.error(errors.join('\n'))

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables')
    }

    // In development, warn but continue with defaults where possible
    console.warn('\nUsing default values where possible...\n')

    // Create a partial env with available values
    _env = envSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/whatsapp_saas',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
    })
  } else {
    _env = result.data
  }

  return _env
}

/**
 * Check if a feature is configured
 */
export const features = {
  get redis() {
    return !!process.env.REDIS_URL
  },

  get googleOAuth() {
    return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
  },

  get whatsapp() {
    return !!process.env.META_APP_SECRET
  },

  get razorpay() {
    return !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET
  },

  get email() {
    return !!process.env.SMTP_HOST
  },

  get storage() {
    return !!process.env.R2_ACCOUNT_ID
  },

  get ai() {
    return !!process.env.OPENAI_API_KEY
  },
}

/**
 * Configuration summary for health checks
 */
export function getConfigSummary(): Record<string, boolean | string> {
  const env = getEnv()

  return {
    environment: env.NODE_ENV,
    database: !!env.DATABASE_URL,
    auth: !!env.NEXTAUTH_SECRET,
    redis: features.redis,
    googleOAuth: features.googleOAuth,
    whatsapp: features.whatsapp,
    razorpay: features.razorpay,
    email: features.email,
    storage: features.storage,
    ai: features.ai,
  }
}

/**
 * Validate environment on import in production
 */
if (process.env.NODE_ENV === 'production') {
  try {
    getEnv()
  } catch {
    // Will be caught and logged by getEnv
    process.exit(1)
  }
}

export default getEnv
