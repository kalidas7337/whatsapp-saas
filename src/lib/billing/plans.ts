import { Plan, PlanId, PlanLimits } from './types'

/**
 * Plan Definitions
 */
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'For individuals getting started',
    price: 0,
    features: [
      '100 messages/month',
      '1 team member',
      'Basic inbox',
      'Community support',
    ],
    limits: {
      messagesPerMonth: 100,
      teamMembers: 1,
      templates: 3,
      botFlows: 0,
      broadcasts: false,
      analytics: false,
      apiAccess: false,
      customIntegrations: false,
      prioritySupport: false,
      dedicatedSupport: false,
      sla: false,
    },
    cta: 'Get Started',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams',
    price: 999,
    priceYearly: 9990, // 2 months free
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID,
    razorpayPlanIdYearly: process.env.NEXT_PUBLIC_RAZORPAY_STARTER_YEARLY_PLAN_ID,
    features: [
      '1,000 messages/month',
      '3 team members',
      'Team inbox',
      '10 templates',
      'Email support',
      'No watermark',
    ],
    limits: {
      messagesPerMonth: 1000,
      teamMembers: 3,
      templates: 10,
      botFlows: 1,
      broadcasts: true,
      analytics: false,
      apiAccess: false,
      customIntegrations: false,
      prioritySupport: false,
      dedicatedSupport: false,
      sla: false,
    },
    cta: 'Start Free Trial',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses',
    price: 2999,
    priceYearly: 29990, // 2 months free
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID,
    razorpayPlanIdYearly: process.env.NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID,
    features: [
      '10,000 messages/month',
      '10 team members',
      '5 bot flows',
      'Unlimited broadcasts',
      'Full analytics',
      'API access',
      'Priority support',
    ],
    limits: {
      messagesPerMonth: 10000,
      teamMembers: 10,
      templates: 50,
      botFlows: 5,
      broadcasts: true,
      analytics: true,
      apiAccess: true,
      customIntegrations: false,
      prioritySupport: true,
      dedicatedSupport: false,
      sla: false,
    },
    popular: true,
    cta: 'Start Free Trial',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: -1, // Custom pricing
    features: [
      'Unlimited messages',
      'Unlimited team members',
      'Unlimited bot flows',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'On-premise option',
    ],
    limits: {
      messagesPerMonth: null,
      teamMembers: null,
      templates: null,
      botFlows: null,
      broadcasts: true,
      analytics: true,
      apiAccess: true,
      customIntegrations: true,
      prioritySupport: true,
      dedicatedSupport: true,
      sla: true,
    },
    cta: 'Contact Sales',
  },
}

/**
 * Get plan by ID
 */
export function getPlan(planId: PlanId): Plan {
  return PLANS[planId] || PLANS.free
}

/**
 * Get all plans as array
 */
export function getAllPlans(): Plan[] {
  return Object.values(PLANS)
}

/**
 * Check if user can perform action based on plan
 */
export function canPerformAction(
  planId: PlanId,
  action: keyof PlanLimits
): boolean {
  const plan = getPlan(planId)
  const limit = plan.limits[action]

  if (typeof limit === 'boolean') {
    return limit
  }

  return limit !== 0
}

/**
 * Check if usage exceeds limit
 */
export function isLimitExceeded(
  planId: PlanId,
  limitType: 'messagesPerMonth' | 'teamMembers' | 'templates' | 'botFlows',
  currentUsage: number
): boolean {
  const plan = getPlan(planId)
  const limit = plan.limits[limitType]

  if (limit === null) return false // Unlimited
  return currentUsage >= limit
}

/**
 * Get usage percentage
 */
export function getUsagePercentage(
  planId: PlanId,
  limitType: 'messagesPerMonth' | 'teamMembers' | 'templates' | 'botFlows',
  currentUsage: number
): number {
  const plan = getPlan(planId)
  const limit = plan.limits[limitType]

  if (limit === null || limit === 0) return 0
  return Math.min((currentUsage / limit) * 100, 100)
}

/**
 * Get plan upgrade options
 */
export function getUpgradeOptions(currentPlanId: PlanId): Plan[] {
  const planOrder: PlanId[] = ['free', 'starter', 'professional', 'enterprise']
  const currentIndex = planOrder.indexOf(currentPlanId)

  return planOrder
    .slice(currentIndex + 1)
    .map((id) => PLANS[id])
    .filter(Boolean)
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency = 'INR'): string {
  if (price === 0) return 'Free'
  if (price === -1) return 'Custom'

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}
