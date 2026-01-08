/**
 * Billing Types
 */

export type PlanId = 'free' | 'starter' | 'professional' | 'enterprise'

export type SubscriptionStatus =
  | 'created'
  | 'authenticated'
  | 'active'
  | 'pending'
  | 'halted'
  | 'cancelled'
  | 'completed'
  | 'expired'
  | 'paused'

export interface Plan {
  id: PlanId
  name: string
  description: string
  price: number // In INR, monthly
  priceYearly?: number // Annual price
  razorpayPlanId?: string
  razorpayPlanIdYearly?: string
  features: string[]
  limits: PlanLimits
  popular?: boolean
  cta: string
}

export interface PlanLimits {
  messagesPerMonth: number | null // null = unlimited
  teamMembers: number | null
  templates: number | null
  botFlows: number | null
  broadcasts: boolean
  analytics: boolean
  apiAccess: boolean
  customIntegrations: boolean
  prioritySupport: boolean
  dedicatedSupport: boolean
  sla: boolean
}

export interface Subscription {
  id: string
  organizationId: string
  razorpayCustomerId: string | null
  razorpaySubscriptionId: string | null
  plan: PlanId
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UsageRecord {
  organizationId: string
  month: string // YYYY-MM
  messagesSent: number
  messagesLimit: number | null
  conversationsCount: number
  teamMembersCount: number
  percentUsed: number
}

export interface Invoice {
  id: string
  razorpayInvoiceId: string
  amount: number
  currency: string
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled' | 'expired'
  invoiceUrl: string | null
  paidAt: Date | null
  createdAt: Date
}

export interface BillingOverview {
  subscription: Subscription
  currentPlan: Plan
  usage: UsageRecord
  invoices: Invoice[]
  canUpgrade: boolean
  canDowngrade: boolean
}

export interface CheckoutResult {
  subscriptionId: string
  shortUrl: string
}

export interface MessageLimitCheck {
  canSend: boolean
  remaining: number | null
  limit: number | null
}

// Razorpay Checkout Options
export interface RazorpayCheckoutOptions {
  key: string
  subscription_id: string
  name: string
  description: string
  image?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
  }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: {
    ondismiss?: () => void
    escape?: boolean
    confirm_close?: boolean
  }
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => {
      open: () => void
      close: () => void
    }
  }
}
