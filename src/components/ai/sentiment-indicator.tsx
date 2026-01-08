'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { Sentiment } from '@repo/whatsapp-core'

interface SentimentIndicatorProps {
  sentiment: Sentiment
  score?: number
  showScore?: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Sentiment configuration
const SENTIMENT_CONFIG = {
  positive: {
    label: 'Positive',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  negative: {
    label: 'Negative',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
      </svg>
    ),
  },
  neutral: {
    label: 'Neutral',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
  },
}

const SIZE_CLASSES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function SentimentIndicator({
  sentiment,
  score,
  showScore = false,
  showLabel = true,
  size = 'md',
  className,
}: SentimentIndicatorProps) {
  const config = SENTIMENT_CONFIG[sentiment]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5',
        config.color,
        SIZE_CLASSES[size],
        className
      )}
      title={`${config.label}${score !== undefined ? ` (${score.toFixed(2)})` : ''}`}
    >
      {config.icon}
      {showLabel && (
        <span className="font-medium">{config.label}</span>
      )}
      {showScore && score !== undefined && (
        <span className="opacity-60">({score.toFixed(2)})</span>
      )}
    </div>
  )
}

// Sentiment bar - visual representation of sentiment score
interface SentimentBarProps {
  score: number // -1 to 1
  showLabels?: boolean
  className?: string
}

export function SentimentBar({
  score,
  showLabels = true,
  className,
}: SentimentBarProps) {
  // Convert score from -1,1 to 0,100
  const percentage = ((score + 1) / 2) * 100

  return (
    <div className={cn('w-full', className)}>
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>
      )}
      <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-gray-400 to-green-500 opacity-30" />

        {/* Indicator */}
        <div
          className="absolute top-0 h-full w-1 bg-black dark:bg-white rounded-full transition-all duration-300"
          style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
        />

        {/* Center marker */}
        <div className="absolute top-0 left-1/2 h-full w-px bg-gray-400 dark:bg-gray-500" />
      </div>
    </div>
  )
}

// Sentiment pill - compact badge style
interface SentimentPillProps {
  sentiment: Sentiment
  className?: string
}

export function SentimentPill({ sentiment, className }: SentimentPillProps) {
  const config = SENTIMENT_CONFIG[sentiment]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  )
}

// Sentiment selector for filtering
export function SentimentSelector({
  value,
  onChange,
  className,
}: {
  value?: Sentiment
  onChange: (sentiment: Sentiment | undefined) => void
  className?: string
}) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value as Sentiment || undefined)}
      className={cn(
        'rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      <option value="">All Sentiments</option>
      <option value="positive">Positive</option>
      <option value="neutral">Neutral</option>
      <option value="negative">Negative</option>
    </select>
  )
}

export { SENTIMENT_CONFIG }
