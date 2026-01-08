'use client'

import { format } from 'date-fns'
import { CreditCard, Calendar, AlertTriangle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Subscription, Plan } from '@/lib/billing/types'

interface SubscriptionCardProps {
  subscription: Subscription
  plan: Plan
  onCancel?: () => void
  onUpgrade: () => void
}

export function SubscriptionCard({
  subscription,
  plan,
  onCancel,
  onUpgrade,
}: SubscriptionCardProps) {
  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'authenticated':
        return <Badge variant="warning">Awaiting Payment</Badge>
      case 'created':
        return <Badge variant="secondary">Created</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'halted':
        return <Badge variant="destructive">Halted</Badge>
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>
      case 'completed':
        return <Badge variant="outline">Completed</Badge>
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      case 'paused':
        return <Badge variant="warning">Paused</Badge>
      default:
        return <Badge variant="outline">{subscription.status}</Badge>
    }
  }

  const canCancel = subscription.razorpaySubscriptionId &&
    ['active', 'authenticated'].includes(subscription.status) &&
    !subscription.cancelAtPeriodEnd

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{plan.name} Plan</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription className="mt-1">{plan.description}</CardDescription>
          </div>
          <div className="text-right">
            {plan.price > 0 ? (
              <>
                <span className="text-2xl font-bold">
                  ₹{plan.price.toLocaleString('en-IN')}
                </span>
                <span className="text-muted-foreground">/month</span>
              </>
            ) : plan.price === 0 ? (
              <span className="text-2xl font-bold">Free</span>
            ) : (
              <span className="text-2xl font-bold">Custom</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Billing period */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Current period:{' '}
            {format(new Date(subscription.currentPeriodStart), 'MMM d')} -{' '}
            {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Trial info */}
        {subscription.trialEnd && subscription.status === 'authenticated' && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
            <Calendar className="h-4 w-4" />
            <span>
              Trial ends {format(new Date(subscription.trialEnd), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {/* Cancellation notice */}
        {subscription.cancelAtPeriodEnd && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Subscription will cancel on{' '}
              {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {canCancel && onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <CreditCard className="h-4 w-4 mr-2" />
              Cancel Subscription
            </Button>
          )}
          {plan.id !== 'enterprise' && (
            <Button variant="default" onClick={onUpgrade}>
              Upgrade Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
