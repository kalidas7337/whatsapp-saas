/**
 * Webhook Service
 * PROMPT 32: External Webhooks & Public API System
 *
 * Manage webhook configurations and deliveries
 */

import { prisma } from '@/lib/prisma'
import type {
  Webhook,
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookEvent,
  WebhookDelivery,
  WebhookPayload,
  WebhookTestResult,
} from './types'
import { generateWebhookSecret, signWebhookPayload } from './middleware'

/**
 * Webhook Service
 */
export class WebhookService {
  private organizationId: string
  private userId: string

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId
    this.userId = userId
  }

  /**
   * List all webhooks for the organization
   */
  async listWebhooks(): Promise<Webhook[]> {
    const webhooks = await prisma.webhooks.findMany({
      where: { organization_id: this.organizationId },
      orderBy: { created_at: 'desc' },
    })

    return webhooks.map(this.mapToWebhook)
  }

  /**
   * Get a single webhook by ID
   */
  async getWebhook(id: string): Promise<Webhook | null> {
    const webhook = await prisma.webhooks.findFirst({
      where: {
        id,
        organization_id: this.organizationId,
      },
    })

    return webhook ? this.mapToWebhook(webhook) : null
  }

  /**
   * Create a new webhook
   */
  async createWebhook(input: CreateWebhookInput): Promise<Webhook> {
    const secret = generateWebhookSecret()

    const webhook = await prisma.webhooks.create({
      data: {
        organization_id: this.organizationId,
        url: input.url,
        secret,
        events: input.events,
        description: input.description,
        headers: input.headers || {},
        created_by: this.userId,
      },
    })

    return this.mapToWebhook(webhook)
  }

  /**
   * Update a webhook
   */
  async updateWebhook(id: string, data: UpdateWebhookInput): Promise<Webhook> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    }

    if (data.url !== undefined) updateData.url = data.url
    if (data.events !== undefined) updateData.events = data.events
    if (data.description !== undefined) updateData.description = data.description
    if (data.headers !== undefined) updateData.headers = data.headers
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const webhook = await prisma.webhooks.update({
      where: { id },
      data: updateData,
    })

    return this.mapToWebhook(webhook)
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    await prisma.webhooks.delete({
      where: { id },
    })
  }

  /**
   * Rotate webhook secret
   */
  async rotateSecret(id: string): Promise<string> {
    const newSecret = generateWebhookSecret()

    await prisma.webhooks.update({
      where: { id },
      data: { secret: newSecret },
    })

    return newSecret
  }

  /**
   * Test webhook delivery
   */
  async testWebhook(id: string): Promise<WebhookTestResult> {
    const webhook = await this.getWebhook(id)
    if (!webhook) throw new Error('Webhook not found')

    const testPayload: WebhookPayload = {
      id: `test_${Date.now()}`,
      event: 'message.received',
      timestamp: new Date().toISOString(),
      organizationId: this.organizationId,
      data: {
        test: true,
        message: 'This is a test webhook delivery',
        timestamp: new Date().toISOString(),
      },
    }

    const payloadString = JSON.stringify(testPayload)
    const signature = signWebhookPayload(payloadString, webhook.secret)

    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Event': testPayload.event,
          ...(webhook.headers || {}),
        },
        body: payloadString,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseTime = Date.now() - startTime

      return {
        success: response.ok,
        statusCode: response.status,
        responseTime,
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage,
        responseTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Get delivery logs for a webhook
   */
  async getDeliveryLogs(webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    const logs = await prisma.webhook_deliveries.findMany({
      where: { webhook_id: webhookId },
      orderBy: { created_at: 'desc' },
      take: limit,
    })

    return logs.map((log) => ({
      id: log.id,
      webhookId: log.webhook_id,
      event: log.event as WebhookEvent,
      payload: log.payload as unknown as WebhookPayload,
      status: log.status as 'pending' | 'success' | 'failed',
      statusCode: log.status_code || undefined,
      response: log.response || undefined,
      attempts: log.attempts,
      nextRetryAt: log.next_retry_at || undefined,
      createdAt: log.created_at,
      deliveredAt: log.delivered_at || undefined,
    }))
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(webhookId: string): Promise<{
    totalDeliveries: number
    successfulDeliveries: number
    failedDeliveries: number
    successRate: number
    last24Hours: number
  }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [total, successful, failed, recent] = await Promise.all([
      prisma.webhook_deliveries.count({
        where: { webhook_id: webhookId },
      }),
      prisma.webhook_deliveries.count({
        where: { webhook_id: webhookId, status: 'success' },
      }),
      prisma.webhook_deliveries.count({
        where: { webhook_id: webhookId, status: 'failed' },
      }),
      prisma.webhook_deliveries.count({
        where: {
          webhook_id: webhookId,
          created_at: { gte: oneDayAgo },
        },
      }),
    ])

    return {
      totalDeliveries: total,
      successfulDeliveries: successful,
      failedDeliveries: failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      last24Hours: recent,
    }
  }

  /**
   * Map database record to Webhook interface
   */
  private mapToWebhook(record: {
    id: string
    organization_id: string
    url: string
    secret: string
    events: string[]
    is_active: boolean
    description: string | null
    headers: unknown
    failure_count: number
    last_triggered_at: Date | null
    last_success_at: Date | null
    last_failure_at: Date | null
    created_by: string
    created_at: Date
    updated_at: Date
  }): Webhook {
    return {
      id: record.id,
      organizationId: record.organization_id,
      url: record.url,
      secret: record.secret,
      events: (record.events as WebhookEvent[]) || [],
      isActive: record.is_active,
      description: record.description || undefined,
      headers: (record.headers as Record<string, string>) || undefined,
      failureCount: record.failure_count || 0,
      lastTriggeredAt: record.last_triggered_at,
      lastSuccessAt: record.last_success_at,
      lastFailureAt: record.last_failure_at,
      createdBy: record.created_by,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }
  }
}

/**
 * Create Webhook Service instance
 */
export function createWebhookService(
  organizationId: string,
  userId: string
): WebhookService {
  return new WebhookService(organizationId, userId)
}
