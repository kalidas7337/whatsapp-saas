'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  BillingOverview,
  PlanId,
  Subscription,
  Plan,
  UsageRecord,
  Invoice,
  RazorpayPaymentResponse,
} from '@/lib/billing/types'

interface UseSubscriptionReturn {
  subscription: Subscription | null
  currentPlan: Plan | null
  usage: UsageRecord | null
  invoices: Invoice[]
  canUpgrade: boolean
  canDowngrade: boolean
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  startCheckout: (planId: PlanId, annual?: boolean) => Promise<void>
  handlePaymentSuccess: (response: RazorpayPaymentResponse) => void
  cancelSubscription: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const [data, setData] = useState<BillingOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/billing/subscription')
      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load subscription data'
      setError(message)
      console.error('Error fetching subscription:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePaymentSuccess = useCallback(async (response: RazorpayPaymentResponse) => {
    try {
      const verifyResponse = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json()
        throw new Error(error.error || 'Payment verification failed')
      }

      toast.success('Subscription activated successfully!')
      fetchData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment verification failed'
      toast.error(message)
      console.error('Error verifying payment:', err)
    }
  }, [fetchData])

  const startCheckout = useCallback(async (planId: PlanId, annual = false) => {
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, annual }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout')
      }

      const { subscriptionId, shortUrl } = await response.json()

      // If we have a short URL, redirect to it (for non-JS fallback)
      if (shortUrl && !window.Razorpay) {
        window.location.href = shortUrl
        return
      }

      // Otherwise, open Razorpay checkout
      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!razorpayKeyId) {
        throw new Error('Razorpay key not configured')
      }

      const options = {
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: 'WhatsApp Business Platform',
        description: `Subscription - ${planId}`,
        theme: {
          color: '#25D366',
        },
        handler: async (paymentResponse: RazorpayPaymentResponse) => {
          handlePaymentSuccess(paymentResponse)
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled')
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout'
      toast.error(message)
      console.error('Error starting checkout:', err)
    }
  }, [handlePaymentSuccess])

  const cancelSubscription = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel subscription')
      }

      toast.success('Subscription will be cancelled at the end of the billing period')
      fetchData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription'
      toast.error(message)
      console.error('Error cancelling subscription:', err)
    }
  }, [fetchData])

  return {
    subscription: data?.subscription || null,
    currentPlan: data?.currentPlan || null,
    usage: data?.usage || null,
    invoices: data?.invoices || [],
    canUpgrade: data?.canUpgrade || false,
    canDowngrade: data?.canDowngrade || false,
    loading,
    error,
    refetch: fetchData,
    startCheckout,
    handlePaymentSuccess,
    cancelSubscription,
  }
}
