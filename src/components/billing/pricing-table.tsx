'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plan, PlanId } from '@/lib/billing/types'
import { getAllPlans } from '@/lib/billing/plans'

interface PricingTableProps {
  currentPlan?: PlanId
  onSelectPlan: (planId: PlanId, annual: boolean) => void
  loading?: boolean
}

export function PricingTable({
  currentPlan,
  onSelectPlan,
  loading,
}: PricingTableProps) {
  const [annual, setAnnual] = useState(false)
  const plans = getAllPlans()

  const formatPrice = (plan: Plan): string => {
    if (plan.price === 0) return 'Free'
    if (plan.price === -1) return 'Custom'

    const price =
      annual && plan.priceYearly ? Math.round(plan.priceYearly / 12) : plan.price

    return `₹${price.toLocaleString('en-IN')}`
  }

  return (
    <div className="space-y-8">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4">
        <Label
          htmlFor="billing-toggle"
          className={cn(!annual && 'text-primary font-medium')}
        >
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={annual}
          onCheckedChange={setAnnual}
        />
        <Label
          htmlFor="billing-toggle"
          className={cn(annual && 'text-primary font-medium', 'flex items-center gap-2')}
        >
          Annual
          <Badge variant="success" className="text-xs">
            Save 17%
          </Badge>
        </Label>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const isPopular = plan.popular

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col',
                isPopular && 'border-primary shadow-lg',
                isCurrent && 'border-primary/50 bg-primary/5'
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-3 py-1">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                {/* Price */}
                <div>
                  <span className="text-4xl font-bold">{formatPrice(plan)}</span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                  {annual && plan.priceYearly && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed annually (₹{plan.priceYearly.toLocaleString('en-IN')}/year)
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isPopular ? 'default' : 'outline'}
                  disabled={isCurrent || loading || plan.id === 'enterprise'}
                  onClick={() => onSelectPlan(plan.id, annual)}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : plan.id === 'enterprise'
                    ? 'Contact Sales'
                    : plan.cta}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
