'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SuggestionItem {
  id: string
  title: string
  content: string
  category?: string
  shortcut?: string
  relevanceScore: number
  matchReason: string
}

interface AISuggestionsProps {
  suggestions: SuggestionItem[]
  onSelect: (suggestion: SuggestionItem) => void
  onDismiss?: () => void
  loading?: boolean
  className?: string
}

export function AISuggestions({
  suggestions,
  onSelect,
  onDismiss,
  loading = false,
  className,
}: AISuggestionsProps) {
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-amber-500" />
            <span>Loading suggestions...</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-md bg-muted"
            />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-amber-500" />
            <span>Suggested Responses</span>
          </CardTitle>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onSelect={() => onSelect(suggestion)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

// Individual suggestion card
interface SuggestionCardProps {
  suggestion: SuggestionItem
  onSelect: () => void
}

function SuggestionCard({ suggestion, onSelect }: SuggestionCardProps) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div
      className={cn(
        'rounded-lg border p-3 cursor-pointer transition-colors',
        'hover:bg-accent hover:border-accent-foreground/20',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect()
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium truncate">{suggestion.title}</h4>
            {suggestion.shortcut && (
              <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                /{suggestion.shortcut}
              </kbd>
            )}
          </div>

          <p className={cn(
            'text-xs text-muted-foreground mt-1',
            !expanded && 'line-clamp-2'
          )}>
            {suggestion.content}
          </p>

          {suggestion.content.length > 100 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              className="text-xs text-primary hover:underline mt-1"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <RelevanceScore score={suggestion.relevanceScore} />
          {suggestion.category && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {suggestion.category}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-muted-foreground italic">
        {suggestion.matchReason}
      </div>
    </div>
  )
}

// Relevance score indicator
function RelevanceScore({ score }: { score: number }) {
  const percentage = Math.round(score * 100)
  const color = score >= 0.8 ? 'text-green-600' : score >= 0.5 ? 'text-amber-600' : 'text-gray-500'

  return (
    <div className={cn('text-xs font-medium flex items-center gap-1', color)}>
      <MatchIcon score={score} />
      <span>{percentage}%</span>
    </div>
  )
}

// Match quality icon
function MatchIcon({ score }: { score: number }) {
  if (score >= 0.8) {
    return (
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    )
  }
  if (score >= 0.5) {
    return (
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )
  }
  return (
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}

// Icons
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// Quick suggestion bar - inline version
interface QuickSuggestionBarProps {
  suggestions: SuggestionItem[]
  onSelect: (suggestion: SuggestionItem) => void
  className?: string
}

export function QuickSuggestionBar({
  suggestions,
  onSelect,
  className,
}: QuickSuggestionBarProps) {
  if (suggestions.length === 0) return null

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto py-2', className)}>
      <span className="text-xs text-muted-foreground shrink-0">Quick replies:</span>
      {suggestions.slice(0, 4).map((suggestion) => (
        <Button
          key={suggestion.id}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion)}
          className="shrink-0 text-xs h-7"
        >
          {suggestion.shortcut ? `/${suggestion.shortcut}` : suggestion.title}
        </Button>
      ))}
    </div>
  )
}
