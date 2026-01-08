/**
 * API Key Service
 * PROMPT 32: External Webhooks & Public API System
 *
 * Manage API keys for external integrations
 */

import { prisma } from '@/lib/prisma'
import type { APIKey, APIKeyWithSecret, CreateAPIKeyInput, APIScope } from './types'
import { generateAPIKey, hashAPIKey } from './middleware'

/**
 * API Key Service
 */
export class APIKeyService {
  private organizationId: string
  private userId: string

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId
    this.userId = userId
  }

  /**
   * List all API keys for the organization
   */
  async listKeys(): Promise<APIKey[]> {
    const keys = await prisma.api_keys.findMany({
      where: { organization_id: this.organizationId },
      orderBy: { created_at: 'desc' },
    })

    return keys.map(this.mapToAPIKey)
  }

  /**
   * Get a single API key by ID
   */
  async getKey(keyId: string): Promise<APIKey | null> {
    const key = await prisma.api_keys.findFirst({
      where: {
        id: keyId,
        organization_id: this.organizationId,
      },
    })

    return key ? this.mapToAPIKey(key) : null
  }

  /**
   * Create a new API key
   */
  async createKey(input: CreateAPIKeyInput): Promise<APIKeyWithSecret> {
    const { key, prefix } = generateAPIKey()
    const keyHash = hashAPIKey(key)

    const created = await prisma.api_keys.create({
      data: {
        organization_id: this.organizationId,
        name: input.name,
        key_prefix: prefix,
        key_hash: keyHash,
        scopes: input.scopes,
        expires_at: input.expiresAt || null,
        created_by: this.userId,
      },
    })

    return {
      ...this.mapToAPIKey(created),
      secret: key, // Only returned on creation
    }
  }

  /**
   * Revoke an API key
   */
  async revokeKey(keyId: string): Promise<void> {
    await prisma.api_keys.update({
      where: {
        id: keyId,
        organization_id: this.organizationId,
      },
      data: { is_active: false },
    })
  }

  /**
   * Update an API key
   */
  async updateKey(
    keyId: string,
    data: { name?: string; scopes?: APIScope[] }
  ): Promise<APIKey> {
    const updated = await prisma.api_keys.update({
      where: {
        id: keyId,
        organization_id: this.organizationId,
      },
      data: {
        name: data.name,
        scopes: data.scopes,
      },
    })

    return this.mapToAPIKey(updated)
  }

  /**
   * Get key usage statistics
   */
  async getKeyStats(keyId: string): Promise<{
    totalRequests: number
    last24Hours: number
    last7Days: number
    lastUsed: Date | null
    requestsByDay: { date: string; count: number }[]
  }> {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [total, last24Hours, last7Days, key, dailyStats] = await Promise.all([
      prisma.api_logs.count({
        where: { api_key_id: keyId },
      }),
      prisma.api_logs.count({
        where: {
          api_key_id: keyId,
          created_at: { gte: oneDayAgo },
        },
      }),
      prisma.api_logs.count({
        where: {
          api_key_id: keyId,
          created_at: { gte: sevenDaysAgo },
        },
      }),
      prisma.api_keys.findUnique({
        where: { id: keyId },
        select: { last_used_at: true },
      }),
      // Get daily request counts for the last 7 days
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM api_logs
        WHERE api_key_id = ${keyId}
        AND created_at >= ${sevenDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `.catch(() => []),
    ])

    return {
      totalRequests: total,
      last24Hours,
      last7Days,
      lastUsed: key?.last_used_at || null,
      requestsByDay: dailyStats.map((row) => ({
        date: String(row.date),
        count: Number(row.count),
      })),
    }
  }

  /**
   * Get recent API logs for a key
   */
  async getKeyLogs(
    keyId: string,
    limit = 50
  ): Promise<
    {
      id: string
      method: string
      path: string
      statusCode: number
      responseTimeMs: number
      ipAddress: string
      createdAt: Date
    }[]
  > {
    const logs = await prisma.api_logs.findMany({
      where: { api_key_id: keyId },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        method: true,
        path: true,
        status_code: true,
        response_time_ms: true,
        ip_address: true,
        created_at: true,
      },
    })

    return logs.map((log) => ({
      id: log.id,
      method: log.method,
      path: log.path,
      statusCode: log.status_code,
      responseTimeMs: log.response_time_ms,
      ipAddress: log.ip_address || 'unknown',
      createdAt: log.created_at,
    }))
  }

  /**
   * Map database record to APIKey interface
   */
  private mapToAPIKey(record: {
    id: string
    organization_id: string
    name: string
    key_prefix: string
    key_hash: string
    scopes: string[]
    last_used_at: Date | null
    expires_at: Date | null
    is_active: boolean
    created_by: string
    created_at: Date
  }): APIKey {
    return {
      id: record.id,
      organizationId: record.organization_id,
      name: record.name,
      keyPrefix: record.key_prefix,
      keyHash: record.key_hash,
      scopes: (record.scopes as APIScope[]) || [],
      lastUsedAt: record.last_used_at,
      expiresAt: record.expires_at,
      isActive: record.is_active,
      createdBy: record.created_by,
      createdAt: record.created_at,
    }
  }
}

/**
 * Create API Key Service instance
 */
export function createAPIKeyService(
  organizationId: string,
  userId: string
): APIKeyService {
  return new APIKeyService(organizationId, userId)
}
