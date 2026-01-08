import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { verifyWebhookSignature, RazorpayWebhookEvent } from '@/lib/billing/razorpay'
import { BillingService } from '@/lib/billing'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('x-razorpay-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing x-razorpay-signature header' },
      { status: 400 }
    )
  }

  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature)) {
    console.error('Webhook signature verification failed')
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  let event: RazorpayWebhookEvent

  try {
    event = JSON.parse(body) as RazorpayWebhookEvent
  } catch {
    console.error('Failed to parse webhook body')
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  try {
    switch (event.event) {
      case 'subscription.authenticated': {
        const subscription = event.payload.subscription?.entity
        if (subscription) {
          console.log(`Subscription authenticated: ${subscription.id}`)
          // Payment method has been authenticated, waiting for first charge
        }
        break
      }

      case 'subscription.activated': {
        const subscription = event.payload.subscription?.entity
        if (subscription) {
          // Find organization by subscription ID
          const sub = await prisma.subscriptions.findFirst({
            where: { razorpay_subscription_id: subscription.id },
          })

          if (sub) {
            const service = new BillingService(sub.organization_id)
            // Get pending plan from notes or database
            const planId = subscription.notes?.planId || sub.pending_plan || 'starter'
            await service.handlePaymentVerified(subscription.id, planId as 'starter' | 'professional' | 'enterprise')
            console.log(`Subscription activated for org ${sub.organization_id}`)
          }
        }
        break
      }

      case 'subscription.charged': {
        const subscription = event.payload.subscription?.entity
        const payment = event.payload.payment?.entity

        if (subscription) {
          const sub = await prisma.subscriptions.findFirst({
            where: { razorpay_subscription_id: subscription.id },
          })

          if (sub) {
            const service = new BillingService(sub.organization_id)
            await service.handleSubscriptionUpdate(
              subscription.id,
              subscription.status,
              subscription.current_end
            )
            console.log(`Subscription charged for org ${sub.organization_id}, payment: ${payment?.id}`)
          }
        }
        break
      }

      case 'subscription.pending': {
        const subscription = event.payload.subscription?.entity
        if (subscription) {
          const sub = await prisma.subscriptions.findFirst({
            where: { razorpay_subscription_id: subscription.id },
          })

          if (sub) {
            const service = new BillingService(sub.organization_id)
            await service.handleSubscriptionUpdate(
              subscription.id,
              'pending',
              subscription.current_end
            )
            console.log(`Subscription pending for org ${sub.organization_id}`)
          }
        }
        break
      }

      case 'subscription.halted': {
        const subscription = event.payload.subscription?.entity
        if (subscription) {
          const sub = await prisma.subscriptions.findFirst({
            where: { razorpay_subscription_id: subscription.id },
          })

          if (sub) {
            const service = new BillingService(sub.organization_id)
            await service.handleSubscriptionUpdate(
              subscription.id,
              'halted',
              subscription.current_end
            )
            console.log(`Subscription halted for org ${sub.organization_id}`)
          }
        }
        break
      }

      case 'subscription.cancelled': {
        const subscription = event.payload.subscription?.entity
        if (subscription) {
          const sub = await prisma.subscriptions.findFirst({
            where: { razorpay_subscription_id: subscription.id },
          })

          if (sub) {
            const service = new BillingService(sub.organization_id)
            await service.handleSubscriptionCanceled(subscription.id)
            console.log(`Subscription cancelled for org ${sub.organization_id}`)
          }
        }
        break
      }

      case 'subscription.completed': {
        const subscription = event.payload.subscription?.entity
        if (subscription) {
          console.log(`Subscription completed: ${subscription.id}`)
          // Subscription has completed its term
        }
        break
      }

      case 'subscription.paused': {
        const subscription = event.payload.subscription?.entity
        if (subscription) {
          const sub = await prisma.subscriptions.findFirst({
            where: { razorpay_subscription_id: subscription.id },
          })

          if (sub) {
            const service = new BillingService(sub.organization_id)
            await service.handleSubscriptionUpdate(
              subscription.id,
              'paused',
              subscription.current_end
            )
            console.log(`Subscription paused for org ${sub.organization_id}`)
          }
        }
        break
      }

      case 'subscription.resumed': {
        const subscription = event.payload.subscription?.entity
        if (subscription) {
          const sub = await prisma.subscriptions.findFirst({
            where: { razorpay_subscription_id: subscription.id },
          })

          if (sub) {
            const service = new BillingService(sub.organization_id)
            await service.handleSubscriptionUpdate(
              subscription.id,
              subscription.status,
              subscription.current_end
            )
            console.log(`Subscription resumed for org ${sub.organization_id}`)
          }
        }
        break
      }

      case 'payment.authorized':
      case 'payment.captured': {
        const payment = event.payload.payment?.entity
        if (payment) {
          console.log(`Payment ${event.event}: ${payment.id}`)
        }
        break
      }

      case 'payment.failed': {
        const payment = event.payload.payment?.entity
        if (payment) {
          console.log(`Payment failed: ${payment.id}, reason: ${payment.error_description}`)
          // Could notify user of failed payment
        }
        break
      }

      default:
        console.log(`Unhandled webhook event: ${event.event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
