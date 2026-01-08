import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: 'connected' | 'disconnected' | 'error'
    redis: 'connected' | 'disconnected' | 'error' | 'not_configured'
    rabbitmq: 'connected' | 'disconnected' | 'error' | 'not_configured'
  }
  details?: Record<string, unknown>
}

// Track start time for uptime calculation
const startTime = Date.now()

// Get version from package.json or environment
const version = process.env.npm_package_version || process.env.APP_VERSION || '1.0.0'

async function checkDatabase(): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return 'connected'
  } catch (error) {
    console.error('Database health check failed:', error)
    return 'error'
  }
}

async function checkRedis(): Promise<'connected' | 'disconnected' | 'error' | 'not_configured'> {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    return 'not_configured'
  }

  // Redis check requires ioredis package
  // Return not_configured if running in standalone mode without workers
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require('ioredis')
    const redis = new Redis(redisUrl, {
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })

    await redis.ping()
    await redis.quit()
    return 'connected'
  } catch (error) {
    // If module not found, return not_configured
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      return 'not_configured'
    }
    console.error('Redis health check failed:', error)
    return 'error'
  }
}

async function checkRabbitMQ(): Promise<'connected' | 'disconnected' | 'error' | 'not_configured'> {
  const rabbitmqUrl = process.env.RABBITMQ_URL

  if (!rabbitmqUrl) {
    return 'not_configured'
  }

  // RabbitMQ check requires amqplib package
  // Return not_configured if running in standalone mode without workers
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const amqp = require('amqplib')
    const connection = await amqp.connect(rabbitmqUrl)
    await connection.close()
    return 'connected'
  } catch (error) {
    // If module not found, return not_configured
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      return 'not_configured'
    }
    console.error('RabbitMQ health check failed:', error)
    return 'error'
  }
}

function determineOverallStatus(checks: HealthStatus['checks']): HealthStatus['status'] {
  // If database is down, system is unhealthy
  if (checks.database === 'error' || checks.database === 'disconnected') {
    return 'unhealthy'
  }

  // If optional services have errors (not just not_configured), system is degraded
  if (checks.redis === 'error' || checks.rabbitmq === 'error') {
    return 'degraded'
  }

  return 'healthy'
}

/**
 * GET /api/health
 * Health check endpoint for load balancers and monitoring
 */
export async function GET() {
  const startCheck = Date.now()

  try {
    // Run all health checks in parallel
    const [databaseStatus, redisStatus, rabbitmqStatus] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkRabbitMQ(),
    ])

    const checks = {
      database: databaseStatus,
      redis: redisStatus,
      rabbitmq: rabbitmqStatus,
    }

    const status = determineOverallStatus(checks)
    const checkDuration = Date.now() - startCheck

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks,
      details: {
        checkDuration: `${checkDuration}ms`,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
      },
    }

    // Return appropriate HTTP status based on health
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    return NextResponse.json(healthStatus, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Health-Status': status,
      },
    })
  } catch (error) {
    console.error('Health check error:', error)

    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        database: 'error',
        redis: 'error',
        rabbitmq: 'error',
      },
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }

    return NextResponse.json(errorStatus, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Health-Status': 'unhealthy',
      },
    })
  }
}

/**
 * HEAD /api/health
 * Simple health check for load balancers (returns only status code)
 */
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
