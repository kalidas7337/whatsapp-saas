import { prisma } from '@/lib/prisma'
import {
  Subscription,
  UsageRecord,
  Invoice,
  BillingOverview,
  PlanId,
  SubscriptionStatus,
  CheckoutResult,
  MessageLimitCheck,
} from './types'
import { getPlan } from './plans'
import {
  createRazorpayCustomer,
  createRazorpaySubscription,
  getRazorpaySubscription,
  cancelRazorpaySubscription,
  getSubscriptionInvoices,
  RazorpaySubscriptionStatus,
} from './razorpay'

/**
 * Map Razorpay status to our status
 */
function mapRazorpayStatus(status: RazorpaySubscriptionStatus): SubscriptionStatus {
  const statusMap: Record<RazorpaySubscriptionStatus, SubscriptionStatus> = {
    created: 'created',
    authenticated: 'authenticated',
    active: 'active',
    pending: 'pending',
    halted: 'halted',
    cancelled: 'cancelled',
    completed: 'completed',
    expired: 'expired',
    paused: 'paused',
  }
  return statusMap[status] || 'pending'
}

/**
 * Billing Service
 */
export class BillingService {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Get billing overview
   */
  async getOverview(): Promise<BillingOverview> {
    const subscription = await this.getSubscription()
    const currentPlan = getPlan(subscription.plan)
    const usage = await this.getCurrentUsage()
    const invoices = await this.getInvoices()

    return {
      subscription,
      currentPlan,
      usage,
      invoices,
      canUpgrade: subscription.plan !== 'enterprise',
      canDowngrade: subscription.plan !== 'free',
    }
  }

  /**
   * Get or create subscription
   */
  async getSubscription(): Promise<Subscription> {
    let subscription = await prisma.subscriptions.findFirst({
      where: { organization_id: this.organizationId },
    })

    if (!subscription) {
      // Create free subscription
      const now = new Date()
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      subscription = await prisma.subscriptions.create({
        data: {
          organization_id: this.organizationId,
          plan: 'free',
          status: 'active',
          current_period_start: now,
          current_period_end: periodEnd,
        },
      })
    }

    return {
      id: subscription.id,
      organizationId: subscription.organization_id,
      razorpayCustomerId: subscription.razorpay_customer_id,
      razorpaySubscriptionId: subscription.razorpay_subscription_id,
      plan: subscription.plan as PlanId,
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      trialEnd: subscription.trial_end,
      createdAt: subscription.created_at,
      updatedAt: subscription.updated_at,
    }
  }

  /**
   * Get current usage
   */
  async getCurrentUsage(): Promise<UsageRecord> {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get message count
    let messageCount = 0
    try {
      const result = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM whatsapp_messages
        WHERE ca_firm_id = ${this.organizationId}
        AND direction = 'OUTBOUND'
        AND created_at >= ${monthStart}
      `
      messageCount = Number(result[0]?.count || 0)
    } catch {
      // Table doesn't exist yet, return 0
      messageCount = 0
    }

    // Get conversation count
    let conversationCount = 0
    try {
      const result = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM whatsapp_conversations
        WHERE ca_firm_id = ${this.organizationId}
        AND created_at >= ${monthStart}
      `
      conversationCount = Number(result[0]?.count || 0)
    } catch {
      conversationCount = 0
    }

    // Get team member count
    const teamCount = await prisma.ca_firm_users.count({
      where: { ca_firm_id: this.organizationId },
    })

    // Get plan limits
    const subscription = await this.getSubscription()
    const plan = getPlan(subscription.plan)
    const messagesLimit = plan.limits.messagesPerMonth

    const percentUsed = messagesLimit
      ? Math.min((messageCount / messagesLimit) * 100, 100)
      : 0

    return {
      organizationId: this.organizationId,
      month,
      messagesSent: messageCount,
      messagesLimit,
      conversationsCount: conversationCount,
      teamMembersCount: teamCount,
      percentUsed,
    }
  }

  /**
   * Get invoices
   */
  async getInvoices(limit = 10): Promise<Invoice[]> {
    const subscription = await this.getSubscription()

    if (!subscription.razorpaySubscriptionId) {
      return []
    }

    try {
      const razorpayInvoices = await getSubscriptionInvoices(
        subscription.razorpaySubscriptionId
      )

      return razorpayInvoices.slice(0, limit).map((inv) => ({
        id: inv.id,
        razorpayInvoiceId: inv.id,
        amount: inv.amount / 100, // Convert paise to INR
        currency: inv.currency,
        status: inv.status,
        invoiceUrl: inv.short_url || null,
        paidAt: inv.paid_at ? new Date(inv.paid_at * 1000) : null,
        createdAt: new Date(inv.created_at * 1000),
      }))
    } catch (error) {
      console.error('Error fetching invoices:', error)
      return []
    }
  }

  /**
   * Create subscription for upgrade
   */
  async createSubscription(
    planId: PlanId,
    annual = false,
    userEmail: string,
    userName: string,
    userContact: string
  ): Promise<CheckoutResult> {
    const plan = getPlan(planId)
    const razorpayPlanId = annual ? plan.razorpayPlanIdYearly : plan.razorpayPlanId

    if (!razorpayPlanId) {
      throw new Error('Razorpay Plan ID not configured for this plan')
    }

    // Get or create Razorpay customer
    const subscription = await this.getSubscription()
    let customerId = subscription.razorpayCustomerId

    if (!customerId) {
      const customer = await createRazorpayCustomer(
        userEmail,
        userName,
        userContact,
        { organizationId: this.organizationId }
      )

      customerId = customer.id

      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: { razorpay_customer_id: customerId },
      })
    }

    // Create Razorpay subscription
    const razorpaySubscription = await createRazorpaySubscription({
      planId: razorpayPlanId,
      customerId,
      totalCount: annual ? 1 : 12, // 1 year or 12 months
      metadata: {
        organizationId: this.organizationId,
        planId,
      },
    })

    // Store pending subscription
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        razorpay_subscription_id: razorpaySubscription.id,
        pending_plan: planId,
        updated_at: new Date(),
      },
    })

    return {
      subscriptionId: razorpaySubscription.id,
      shortUrl: razorpaySubscription.short_url,
    }
  }

  /**
   * Handle successful payment verification
   */
  async handlePaymentVerified(
    razorpaySubscriptionId: string,
    planId: PlanId
  ): Promise<void> {
    const razorpaySubscription = await getRazorpaySubscription(razorpaySubscriptionId)

    await prisma.subscriptions.updateMany({
      where: { organization_id: this.organizationId },
      data: {
        razorpay_subscription_id: razorpaySubscriptionId,
        plan: planId,
        status: mapRazorpayStatus(razorpaySubscription.status),
        current_period_start: new Date(razorpaySubscription.current_start * 1000),
        current_period_end: new Date(razorpaySubscription.current_end * 1000),
        pending_plan: null,
        updated_at: new Date(),
      },
    })
  }

  /**
   * Handle subscription update from webhook
   */
  async handleSubscriptionUpdate(
    razorpaySubscriptionId: string,
    status: RazorpaySubscriptionStatus,
    currentEnd: number
  ): Promise<void> {
    await prisma.subscriptions.updateMany({
      where: { razorpay_subscription_id: razorpaySubscriptionId },
      data: {
        status: mapRazorpayStatus(status),
        current_period_end: new Date(currentEnd * 1000),
        updated_at: new Date(),
      },
    })
  }

  /**
   * Handle subscription cancellation
   */
  async handleSubscriptionCanceled(razorpaySubscriptionId: string): Promise<void> {
    await prisma.subscriptions.updateMany({
      where: { razorpay_subscription_id: razorpaySubscriptionId },
      data: {
        plan: 'free',
        status: 'cancelled',
        razorpay_subscription_id: null,
        pending_plan: null,
        updated_at: new Date(),
      },
    })
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(atPeriodEnd = true): Promise<void> {
    const subscription = await this.getSubscription()

    if (!subscription.razorpaySubscriptionId) {
      throw new Error('No active subscription found')
    }

    await cancelRazorpaySubscription(subscription.razorpaySubscriptionId, atPeriodEnd)

    await prisma.subscriptions.updateMany({
      where: { organization_id: this.organizationId },
      data: {
        cancel_at_period_end: atPeriodEnd,
        updated_at: new Date(),
      },
    })
  }

  /**
   * Check if feature is available
   */
  async canUseFeature(feature: string): Promise<boolean> {
    const subscription = await this.getSubscription()
    const plan = getPlan(subscription.plan)

    switch (feature) {
      case 'broadcasts':
        return plan.limits.broadcasts
      case 'analytics':
        return plan.limits.analytics
      case 'api':
        return plan.limits.apiAccess
      case 'bot_flows':
        return (plan.limits.botFlows || 0) > 0
      default:
        return true
    }
  }

  /**
   * Check message limit
   */
  async checkMessageLimit(): Promise<MessageLimitCheck> {
    const usage = await this.getCurrentUsage()

    if (usage.messagesLimit === null) {
      return { canSend: true, remaining: null, limit: null }
    }

    const remaining = Math.max(0, usage.messagesLimit - usage.messagesSent)

    return {
      canSend: remaining > 0,
      remaining,
      limit: usage.messagesLimit,
    }
  }
}
