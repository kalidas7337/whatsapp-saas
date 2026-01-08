import Razorpay from 'razorpay'
import crypto from 'crypto'

// Initialize Razorpay client (only on server side)
let razorpayClient: Razorpay | null = null

function getRazorpayClient(): Razorpay {
  if (!razorpayClient) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required')
    }

    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  }
  return razorpayClient
}

// Export razorpay instance getter
export const razorpay = {
  get client() {
    return getRazorpayClient()
  },
}

/**
 * Create Razorpay customer
 */
export async function createRazorpayCustomer(
  email: string,
  name: string,
  contact: string,
  metadata: { organizationId: string }
): Promise<{ id: string }> {
  const client = getRazorpayClient()
  return client.customers.create({
    name,
    email,
    contact,
    notes: metadata,
  })
}

/**
 * Create Razorpay subscription
 */
export async function createRazorpaySubscription({
  planId,
  customerId,
  totalCount = 12,
  quantity = 1,
  startAt,
  metadata,
}: {
  planId: string
  customerId?: string
  totalCount?: number
  quantity?: number
  startAt?: number
  metadata?: Record<string, string>
}): Promise<RazorpaySubscription> {
  const client = getRazorpayClient()

  // Build the subscription request
  const subscriptionRequest = {
    plan_id: planId,
    total_count: totalCount,
    quantity,
    customer_notify: 1,
    notes: metadata || {},
    ...(customerId && { customer_id: customerId }),
    ...(startAt && { start_at: startAt }),
  }

  // Type assertion needed for the Razorpay SDK
  const subscription = await client.subscriptions.create(
    subscriptionRequest as Parameters<typeof client.subscriptions.create>[0]
  )
  return subscription as unknown as RazorpaySubscription
}

/**
 * Get Razorpay subscription
 */
export async function getRazorpaySubscription(
  subscriptionId: string
): Promise<RazorpaySubscription> {
  const client = getRazorpayClient()
  const subscription = await client.subscriptions.fetch(subscriptionId)
  return subscription as unknown as RazorpaySubscription
}

/**
 * Cancel Razorpay subscription
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd = true
): Promise<RazorpaySubscription> {
  const client = getRazorpayClient()
  const subscription = await client.subscriptions.cancel(subscriptionId, cancelAtCycleEnd)
  return subscription as unknown as RazorpaySubscription
}

/**
 * Pause Razorpay subscription
 */
export async function pauseRazorpaySubscription(
  subscriptionId: string
): Promise<RazorpaySubscription> {
  const client = getRazorpayClient()
  const subscription = await client.subscriptions.pause(subscriptionId)
  return subscription as unknown as RazorpaySubscription
}

/**
 * Resume Razorpay subscription
 */
export async function resumeRazorpaySubscription(
  subscriptionId: string
): Promise<RazorpaySubscription> {
  const client = getRazorpayClient()
  const subscription = await client.subscriptions.resume(subscriptionId)
  return subscription as unknown as RazorpaySubscription
}

/**
 * Create Razorpay order (for one-time payments)
 */
export async function createRazorpayOrder({
  amount,
  currency = 'INR',
  receipt,
  notes,
}: {
  amount: number // in paise
  currency?: string
  receipt: string
  notes?: Record<string, string>
}): Promise<RazorpayOrder> {
  const client = getRazorpayClient()
  const order = await client.orders.create({
    amount,
    currency,
    receipt,
    notes: notes || {},
  })
  return order as unknown as RazorpayOrder
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId?: string
  paymentId: string
  signature: string
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not set')
  }

  const body = orderId
    ? `${orderId}|${paymentId}`
    : paymentId

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

/**
 * Verify Razorpay subscription signature
 */
export function verifySubscriptionSignature({
  subscriptionId,
  paymentId,
  signature,
}: {
  subscriptionId: string
  paymentId: string
  signature: string
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not set')
  }

  const body = `${paymentId}|${subscriptionId}`

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is not set')
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

/**
 * Get payment details
 */
export async function getRazorpayPayment(
  paymentId: string
): Promise<RazorpayPayment> {
  const client = getRazorpayClient()
  const payment = await client.payments.fetch(paymentId)
  return payment as unknown as RazorpayPayment
}

/**
 * Get all invoices for a subscription
 */
export async function getSubscriptionInvoices(
  subscriptionId: string
): Promise<RazorpayInvoice[]> {
  const client = getRazorpayClient()
  const invoices = await client.invoices.all({
    subscription_id: subscriptionId,
  })
  return (invoices.items || []) as unknown as RazorpayInvoice[]
}

// Razorpay Types
export interface RazorpaySubscription {
  id: string
  entity: 'subscription'
  plan_id: string
  customer_id: string | null
  status: RazorpaySubscriptionStatus
  current_start: number
  current_end: number
  ended_at: number | null
  quantity: number
  notes: Record<string, string>
  charge_at: number
  offer_id: string | null
  short_url: string
  has_scheduled_changes: boolean
  change_scheduled_at: number | null
  source: string
  payment_method: string
  created_at: number
  expire_by: number | null
  remaining_count: number
  paid_count: number
  customer_notify: number
  total_count: number
}

export type RazorpaySubscriptionStatus =
  | 'created'
  | 'authenticated'
  | 'active'
  | 'pending'
  | 'halted'
  | 'cancelled'
  | 'completed'
  | 'expired'
  | 'paused'

export interface RazorpayOrder {
  id: string
  entity: 'order'
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  offer_id: string | null
  status: 'created' | 'attempted' | 'paid'
  attempts: number
  notes: Record<string, string>
  created_at: number
}

export interface RazorpayPayment {
  id: string
  entity: 'payment'
  amount: number
  currency: string
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed'
  order_id: string
  invoice_id: string | null
  international: boolean
  method: string
  amount_refunded: number
  refund_status: string | null
  captured: boolean
  description: string
  card_id: string | null
  bank: string | null
  wallet: string | null
  vpa: string | null
  email: string
  contact: string
  customer_id: string | null
  notes: Record<string, string>
  fee: number
  tax: number
  error_code: string | null
  error_description: string | null
  error_source: string | null
  error_step: string | null
  error_reason: string | null
  acquirer_data: Record<string, string>
  created_at: number
}

export interface RazorpayInvoice {
  id: string
  entity: 'invoice'
  type: string
  invoice_number: string
  customer_id: string
  customer_details: {
    id: string
    name: string
    email: string
    contact: string
  }
  order_id: string
  line_items: Array<{
    id: string
    item_id: string
    name: string
    description: string
    amount: number
    quantity: number
  }>
  payment_id: string | null
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled' | 'expired'
  expire_by: number
  issued_at: number
  paid_at: number | null
  cancelled_at: number | null
  expired_at: number | null
  sms_status: string
  email_status: string
  date: number
  terms: string | null
  partial_payment: boolean
  gross_amount: number
  tax_amount: number
  taxable_amount: number
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  currency_symbol: string
  description: string | null
  notes: Record<string, string>
  short_url: string
  view_less: boolean
  billing_start: number
  billing_end: number
  group_taxes_discounts: boolean
  created_at: number
  subscription_id: string | null
}

export interface RazorpayWebhookEvent {
  entity: 'event'
  account_id: string
  event: string
  contains: string[]
  payload: {
    subscription?: {
      entity: RazorpaySubscription
    }
    payment?: {
      entity: RazorpayPayment
    }
    order?: {
      entity: RazorpayOrder
    }
    invoice?: {
      entity: RazorpayInvoice
    }
  }
  created_at: number
}
