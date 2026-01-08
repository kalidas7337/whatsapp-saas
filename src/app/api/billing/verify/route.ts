import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifySubscriptionSignature } from '@/lib/billing/razorpay'
import { BillingService } from '@/lib/billing'
import { prisma } from '@/lib/prisma'
import { PlanId } from '@/lib/billing/types'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = await request.json()

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment fields' },
        { status: 400 }
      )
    }

    // Verify signature
    const isValid = verifySubscriptionSignature({
      subscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Get the pending plan from database
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        organization_id: session.user.organizationId,
        razorpay_subscription_id,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    const planId = (subscription.pending_plan || 'starter') as PlanId

    // Update subscription with verified payment
    const service = new BillingService(session.user.organizationId)
    await service.handlePaymentVerified(razorpay_subscription_id, planId)

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      plan: planId,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
