'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSubscription } from '@/hooks/billing'
import {
  SubscriptionCard,
  UsageCard,
  InvoiceList,
  PricingTable,
} from '@/components/billing'

function BillingPageContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')

  const {
    subscription,
    currentPlan,
    usage,
    invoices,
    loading,
    startCheckout,
    cancelSubscription,
    refetch,
  } = useSubscription()

  // Handle success/cancel from payment
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription updated successfully!')
      refetch()
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Payment cancelled')
    }
  }, [searchParams, refetch])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {subscription && currentPlan && (
            <SubscriptionCard
              subscription={subscription}
              plan={currentPlan}
              onCancel={cancelSubscription}
              onUpgrade={() => setActiveTab('plans')}
            />
          )}

          {usage && currentPlan && (
            <UsageCard usage={usage} plan={currentPlan} />
          )}
        </TabsContent>

        <TabsContent value="plans">
          <PricingTable
            currentPlan={subscription?.plan}
            onSelectPlan={startCheckout}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceList invoices={invoices} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  )
}
