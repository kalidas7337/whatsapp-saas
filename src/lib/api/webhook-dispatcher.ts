/**
 * Webhook Dispatcher
 * PROMPT 32: External Webhooks & Public API System
 *
 * Dispatch webhook events to subscribed endpoints
 */

import { prisma } from '@/lib/prisma'
import type { WebhookEvent, WebhookPayload } from './types'
import { signWebhookPayload } from './middleware'

// Retry configuration
const MAX_RETRIES = 5
const RETRY_DELAYS = [1000, 5000, 30000, 120000, 600000] // 1s, 5s, 30s, 2m, 10m

/**
 * Webhook Dispatcher
 * Handles event distribution to subscribed webhook endpoints
 */
export class WebhookDispatcher {
  /**
   * Dispatch event to all subscribed webhooks
   */
  static async dispatch(
    organizationId: string,
    event: WebhookEvent,
    data: Record<string, unknown>
  ): Promise<void> {
    // Find all active webhooks subscribed to this event
    const webhooks = await prisma.webhooks.findMany({
      where: {
        organization_id: organizationId,
        is_active: true,
        events: { has: event },
      },
    })

    if (webhooks.length === 0) return

    const payload: WebhookPayload = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event,
      timestamp: new Date().toISOString(),
      organizationId,
      data,
    }

    // Queue deliveries for each webhook
    for (const webhook of webhooks) {
      await this.queueDelivery(webhook, payload)
    }
  }

  /**
   * Queue webhook delivery
   */
  private static async queueDelivery(
    webhook: {
      id: string
      url: string
      secret: string
      headers: unknown
    },
    payload: WebhookPayload
  ): Promise<void> {
    // Create delivery record
    const delivery = await prisma.webhook_deliveries.create({
      data: {
        webhook_id: webhook.id,
        event: payload.event,
        payload: JSON.parse(JSON.stringify(payload)),
        status: 'pending',
        attempts: 0,
      },
    })

    // In production, this would queue to RabbitMQ or similar
    // For now, deliver asynchronously without blocking
    this.deliverWebhook(webhook, payload, delivery.id).catch((error) => {
      console.error('Webhook delivery error:', error)
    })
  }

  /**
   * Deliver webhook to endpoint
   */
  private static async deliverWebhook(
    webhook: {
      id: string
      url: string
      secret: string
      headers: unknown
    },
    payload: WebhookPayload,
    deliveryId: string,
    attempt = 0
  ): Promise<void> {
    const payloadString = JSON.stringify(payload)
    const signature = signWebhookPayload(payloadString, webhook.secret)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Event': payload.event,
          'X-Webhook-Delivery-ID': deliveryId,
          ...((webhook.headers as Record<string, string>) || {}),
        },
        body: payloadString,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const isSuccess = response.ok

      // Update delivery status
      await prisma.webhook_deliveries.update({
        where: { id: deliveryId },
        data: {
          status: isSuccess ? 'success' : 'failed',
          status_code: response.status,
          attempts: attempt + 1,
          delivered_at: isSuccess ? new Date() : null,
          response: isSuccess ? null : `HTTP ${response.status}`,
        },
      })

      // Update webhook stats
      await prisma.webhooks.update({
        where: { id: webhook.id },
        data: {
          last_triggered_at: new Date(),
          ...(isSuccess
            ? { last_success_at: new Date(), failure_count: 0 }
            : { last_failure_at: new Date(), failure_count: { increment: 1 } }),
        },
      })

      // Retry if failed and attempts remaining
      if (!isSuccess && attempt < MAX_RETRIES - 1) {
        const retryDelay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
        const nextRetryAt = new Date(Date.now() + retryDelay)

        await prisma.webhook_deliveries.update({
          where: { id: deliveryId },
          data: {
            status: 'pending',
            next_retry_at: nextRetryAt,
          },
        })

        // Schedule retry
        setTimeout(() => {
          this.deliverWebhook(webhook, payload, deliveryId, attempt + 1).catch(
            console.error
          )
        }, retryDelay)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Mark as failed
      await prisma.webhook_deliveries.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          attempts: attempt + 1,
          response: errorMessage,
        },
      })

      await prisma.webhooks.update({
        where: { id: webhook.id },
        data: {
          last_triggered_at: new Date(),
          last_failure_at: new Date(),
          failure_count: { increment: 1 },
        },
      })

      // Retry if attempts remaining
      if (attempt < MAX_RETRIES - 1) {
        const retryDelay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
        const nextRetryAt = new Date(Date.now() + retryDelay)

        await prisma.webhook_deliveries.update({
          where: { id: deliveryId },
          data: {
            status: 'pending',
            next_retry_at: nextRetryAt,
          },
        })

        setTimeout(() => {
          this.deliverWebhook(webhook, payload, deliveryId, attempt + 1).catch(
            console.error
          )
        }, retryDelay)
      }
    }
  }

  /**
   * Retry failed deliveries (called by cron job)
   */
  static async retryPendingDeliveries(): Promise<number> {
    const pendingDeliveries = await prisma.webhook_deliveries.findMany({
      where: {
        status: 'pending',
        next_retry_at: { lte: new Date() },
        attempts: { lt: MAX_RETRIES },
      },
      include: {
        webhook: true,
      },
      take: 100,
    })

    let retriedCount = 0

    for (const delivery of pendingDeliveries) {
      const webhook = delivery.webhook
      if (!webhook || !webhook.is_active) continue

      const payload = delivery.payload as unknown as WebhookPayload

      this.deliverWebhook(
        {
          id: webhook.id,
          url: webhook.url,
          secret: webhook.secret,
          headers: webhook.headers,
        },
        payload,
        delivery.id,
        delivery.attempts
      ).catch(console.error)

      retriedCount++
    }

    return retriedCount
  }
}

// ============================================================================
// Helper Functions for Common Events
// ============================================================================

/**
 * Dispatch message received event
 */
export async function dispatchMessageReceived(
  organizationId: string,
  message: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'message.received', message)
}

/**
 * Dispatch message sent event
 */
export async function dispatchMessageSent(
  organizationId: string,
  message: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'message.sent', message)
}

/**
 * Dispatch message delivered event
 */
export async function dispatchMessageDelivered(
  organizationId: string,
  message: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'message.delivered', message)
}

/**
 * Dispatch message read event
 */
export async function dispatchMessageRead(
  organizationId: string,
  message: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'message.read', message)
}

/**
 * Dispatch message failed event
 */
export async function dispatchMessageFailed(
  organizationId: string,
  message: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'message.failed', message)
}

/**
 * Dispatch conversation created event
 */
export async function dispatchConversationCreated(
  organizationId: string,
  conversation: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'conversation.created', conversation)
}

/**
 * Dispatch conversation assigned event
 */
export async function dispatchConversationAssigned(
  organizationId: string,
  conversation: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'conversation.assigned', conversation)
}

/**
 * Dispatch conversation resolved event
 */
export async function dispatchConversationResolved(
  organizationId: string,
  conversation: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'conversation.resolved', conversation)
}

/**
 * Dispatch conversation reopened event
 */
export async function dispatchConversationReopened(
  organizationId: string,
  conversation: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'conversation.reopened', conversation)
}

/**
 * Dispatch contact created event
 */
export async function dispatchContactCreated(
  organizationId: string,
  contact: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'contact.created', contact)
}

/**
 * Dispatch contact updated event
 */
export async function dispatchContactUpdated(
  organizationId: string,
  contact: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'contact.updated', contact)
}

/**
 * Dispatch contact opted out event
 */
export async function dispatchContactOptedOut(
  organizationId: string,
  contact: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'contact.opted_out', contact)
}

/**
 * Dispatch campaign started event
 */
export async function dispatchCampaignStarted(
  organizationId: string,
  campaign: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'campaign.started', campaign)
}

/**
 * Dispatch campaign completed event
 */
export async function dispatchCampaignCompleted(
  organizationId: string,
  campaign: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'campaign.completed', campaign)
}

/**
 * Dispatch campaign failed event
 */
export async function dispatchCampaignFailed(
  organizationId: string,
  campaign: Record<string, unknown>
): Promise<void> {
  return WebhookDispatcher.dispatch(organizationId, 'campaign.failed', campaign)
}
