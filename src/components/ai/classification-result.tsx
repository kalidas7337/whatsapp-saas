'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IntentBadge } from './intent-badge'
import { SentimentIndicator, SentimentBar } from './sentiment-indicator'
import type { Intent, Sentiment, Priority, Entity } from '@repo/whatsapp-core'

interface ClassificationResultProps {
  intent: Intent
  intentCategory: string
  confidence: number
  sentiment: Sentiment
  sentimentScore: number
  priority: Priority
  language: string
  entities: Entity[]
  className?: string
  compact?: boolean
}

export function ClassificationResult({
  intent,
  intentCategory,
  confidence,
  sentiment,
  sentimentScore,
  priority,
  language,
  entities,
  className,
  compact = false,
}: ClassificationResultProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        <IntentBadge intent={intent} confidence={confidence} showConfidence priority={priority} />
        <SentimentIndicator sentiment={sentiment} size="sm" />
        <PriorityBadge priority={priority} />
      </div>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BrainIcon className="h-4 w-4 text-primary" />
          <span>AI Classification</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main classification */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Intent</div>
            <IntentBadge intent={intent} confidence={confidence} showConfidence />
          </div>
          <div className="space-y-1 text-right">
            <div className="text-xs text-muted-foreground">Priority</div>
            <PriorityBadge priority={priority} />
          </div>
        </div>

        {/* Sentiment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Sentiment</div>
            <SentimentIndicator sentiment={sentiment} score={sentimentScore} showScore size="sm" />
          </div>
          <SentimentBar score={sentimentScore} showLabels={false} />
        </div>

        {/* Additional info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Language:</span>
            <LanguageBadge language={language} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Category:</span>
            <span className="font-medium capitalize">{intentCategory}</span>
          </div>
        </div>

        {/* Confidence meter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-medium">{(confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                confidence >= 0.8 ? 'bg-green-500' : confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Entities */}
        {entities.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Extracted Entities</div>
            <div className="flex flex-wrap gap-1">
              {entities.map((entity, index) => (
                <EntityBadge key={index} entity={entity} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Priority badge
interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

const PRIORITY_CONFIG: Record<Priority, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  urgent: { label: 'Urgent', variant: 'destructive' },
  high: { label: 'High', variant: 'default' },
  medium: { label: 'Medium', variant: 'secondary' },
  low: { label: 'Low', variant: 'outline' },
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]
  return (
    <Badge variant={config.variant} className={cn('capitalize', className)}>
      {config.label}
    </Badge>
  )
}

// Language badge
function LanguageBadge({ language }: { language: string }) {
  const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    es: 'Spanish',
    fr: 'French',
    ar: 'Arabic',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    bn: 'Bengali',
    gu: 'Gujarati',
    ta: 'Tamil',
    te: 'Telugu',
    kn: 'Kannada',
    ml: 'Malayalam',
    pa: 'Punjabi',
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="font-mono uppercase bg-muted px-1 py-0.5 rounded">
        {language}
      </span>
      <span className="text-muted-foreground">
        ({LANGUAGE_NAMES[language] || language})
      </span>
    </span>
  )
}

// Entity badge
function EntityBadge({ entity }: { entity: Entity }) {
  const ENTITY_COLORS: Record<string, string> = {
    phone: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    email: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    url: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
    date: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    amount: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    order_id: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    name: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
        ENTITY_COLORS[entity.type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
      )}
    >
      <span className="font-medium capitalize">{entity.type}:</span>
      <span className="font-mono truncate max-w-[150px]">{entity.value}</span>
    </span>
  )
}

// Icons
function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

// Mini classification badge - very compact
interface ClassificationBadgesProps {
  intent: Intent
  sentiment: Sentiment
  priority: Priority
  confidence: number
  className?: string
}

export function ClassificationBadges({
  intent,
  sentiment,
  priority,
  confidence,
  className,
}: ClassificationBadgesProps) {
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <IntentBadge intent={intent} priority={priority} />
      <SentimentIndicator sentiment={sentiment} showLabel={false} size="sm" />
      <span className="text-[10px] text-muted-foreground">
        {(confidence * 100).toFixed(0)}%
      </span>
    </div>
  )
}
