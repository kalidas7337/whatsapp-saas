'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RazorpayPaymentResponse, Plan } from '@/lib/billing/types'
import { Loader2 } from 'lucide-react'

interface RazorpayButtonProps {
  plan: Plan
  annual?: boolean
  userEmail?: string
  userName?: string
  userContact?: string
  onSuccess?: (response: RazorpayPaymentResponse) => void
  onError?: (error: Error) => void
  className?: string
  disabled?: boolean
}

export function RazorpayButton({
  plan,
  annual = false,
  userEmail,
  userName,
  userContact,
  onSuccess,
  onError,
  className,
  disabled = false,
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Load Razorpay script
  useEffect(() => {
    const loadScript = () => {
      if (document.getElementById('razorpay-script')) {
        setScriptLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.id = 'razorpay-script'
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => setScriptLoaded(true)
      script.onerror = () => {
        console.error('Failed to load Razorpay script')
        onError?.(new Error('Failed to load payment gateway'))
      }
      document.body.appendChild(script)
    }

    loadScript()
  }, [onError])

  const handlePayment = async () => {
    if (!scriptLoaded) {
      onError?.(new Error('Payment gateway not loaded'))
      return
    }

    setLoading(true)

    try {
      // Create subscription on backend
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          annual,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create subscription')
      }

      const { subscriptionId } = await response.json()

      // Open Razorpay checkout
      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!razorpayKeyId) {
        throw new Error('Razorpay key not configured')
      }

      const options = {
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: 'WhatsApp Business Platform',
        description: `${plan.name} Plan - ${annual ? 'Annual' : 'Monthly'}`,
        image: '/logo.png',
        prefill: {
          name: userName,
          email: userEmail,
          contact: userContact,
        },
        notes: {
          planId: plan.id,
        },
        theme: {
          color: '#25D366',
        },
        handler: async (response: RazorpayPaymentResponse) => {
          // Verify payment on backend
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

            onSuccess?.(response)
          } catch (error) {
            onError?.(error as Error)
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          },
          escape: true,
          confirm_close: true,
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      onError?.(error as Error)
      setLoading(false)
    }
  }

  const isEnterprise = plan.id === 'enterprise'

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading || !scriptLoaded || isEnterprise}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        plan.cta
      )}
    </Button>
  )
}
