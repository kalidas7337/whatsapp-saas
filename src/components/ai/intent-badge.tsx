'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { Intent, IntentCategory } from '@repo/whatsapp-core'

// Intent category colors
const intentVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      category: {
        support:
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
        sales:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        administrative:
          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
        other:
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
      },
      priority: {
        urgent:
          'ring-2 ring-red-500 ring-offset-1',
        high:
          'ring-1 ring-orange-400 ring-offset-1',
        medium: '',
        low: 'opacity-80',
      },
    },
    defaultVariants: {
      category: 'other',
      priority: 'medium',
    },
  }
)

// Intent display labels
const INTENT_LABELS: Record<Intent, string> = {
  general_inquiry: 'General Inquiry',
  product_inquiry: 'Product Inquiry',
  pricing_inquiry: 'Pricing',
  order_status: 'Order Status',
  complaint: 'Complaint',
  feedback: 'Feedback',
  technical_support: 'Tech Support',
  purchase_intent: 'Purchase Intent',
  quote_request: 'Quote Request',
  negotiation: 'Negotiation',
  follow_up: 'Follow Up',
  appointment_booking: 'Appointment',
  document_request: 'Document Request',
  account_update: 'Account Update',
  cancellation: 'Cancellation',
  greeting: 'Greeting',
  gratitude: 'Thanks',
  spam: 'Spam',
  unknown: 'Unknown',
}

// Intent to category mapping
const INTENT_CATEGORIES: Record<Intent, IntentCategory> = {
  general_inquiry: 'support',
  product_inquiry: 'support',
  pricing_inquiry: 'sales',
  order_status: 'support',
  complaint: 'support',
  feedback: 'support',
  technical_support: 'support',
  purchase_intent: 'sales',
  quote_request: 'sales',
  negotiation: 'sales',
  follow_up: 'sales',
  appointment_booking: 'administrative',
  document_request: 'administrative',
  account_update: 'administrative',
  cancellation: 'administrative',
  greeting: 'other',
  gratitude: 'other',
  spam: 'other',
  unknown: 'other',
}

export interface IntentBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof intentVariants> {
  intent: Intent
  confidence?: number
  showConfidence?: boolean
  priority?: 'urgent' | 'high' | 'medium' | 'low'
}

export function IntentBadge({
  intent,
  confidence,
  showConfidence = false,
  priority = 'medium',
  className,
  ...props
}: IntentBadgeProps) {
  const category = INTENT_CATEGORIES[intent]
  const label = INTENT_LABELS[intent]

  return (
    <span
      className={cn(
        intentVariants({ category, priority }),
        className
      )}
      title={`${label} (${category})${confidence ? ` - ${(confidence * 100).toFixed(0)}% confidence` : ''}`}
      {...props}
    >
      <span className="flex items-center gap-1">
        <CategoryIcon category={category} />
        <span>{label}</span>
        {showConfidence && confidence && (
          <span className="ml-1 opacity-60">
            ({(confidence * 100).toFixed(0)}%)
          </span>
        )}
      </span>
    </span>
  )
}

// Category icons
function CategoryIcon({ category }: { category: IntentCategory }) {
  switch (category) {
    case 'support':
      return (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    case 'sales':
      return (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'administrative':
      return (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    default:
      return (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
  }
}

// Intent selector for filtering/searching
export function IntentSelector({
  value,
  onChange,
  className,
}: {
  value?: Intent
  onChange: (intent: Intent | undefined) => void
  className?: string
}) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value as Intent || undefined)}
      className={cn(
        'rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      <option value="">All Intents</option>
      <optgroup label="Support">
        <option value="general_inquiry">General Inquiry</option>
        <option value="product_inquiry">Product Inquiry</option>
        <option value="order_status">Order Status</option>
        <option value="complaint">Complaint</option>
        <option value="feedback">Feedback</option>
        <option value="technical_support">Technical Support</option>
      </optgroup>
      <optgroup label="Sales">
        <option value="pricing_inquiry">Pricing Inquiry</option>
        <option value="purchase_intent">Purchase Intent</option>
        <option value="quote_request">Quote Request</option>
        <option value="negotiation">Negotiation</option>
        <option value="follow_up">Follow Up</option>
      </optgroup>
      <optgroup label="Administrative">
        <option value="appointment_booking">Appointment Booking</option>
        <option value="document_request">Document Request</option>
        <option value="account_update">Account Update</option>
        <option value="cancellation">Cancellation</option>
      </optgroup>
      <optgroup label="Other">
        <option value="greeting">Greeting</option>
        <option value="gratitude">Gratitude</option>
        <option value="spam">Spam</option>
        <option value="unknown">Unknown</option>
      </optgroup>
    </select>
  )
}

export { INTENT_LABELS, INTENT_CATEGORIES }
