'use client'

import { useRef, useEffect } from 'react'
import { Loader2, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CannedResponse } from '@/lib/responses/types'

interface QuickReplyPopupProps {
  isOpen: boolean
  suggestions: CannedResponse[]
  selectedIndex: number
  loading: boolean
  position?: { top: number; left: number }
  onSelect: (response: CannedResponse) => void
  onHover: (index: number) => void
}

export function QuickReplyPopup({
  isOpen,
  suggestions,
  selectedIndex,
  loading,
  position,
  onSelect,
  onHover,
}: QuickReplyPopupProps) {
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div
      className="absolute bottom-full mb-2 left-0 right-0 bg-popover border rounded-lg shadow-lg z-50 max-h-[300px] overflow-hidden"
      style={position ? { top: position.top, left: position.left } : undefined}
    >
      {loading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No matching responses found
        </div>
      ) : (
        <div ref={listRef} className="max-h-[250px] overflow-y-auto">
          {suggestions.map((response, index) => (
            <div
              key={response.id}
              className={cn(
                'px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors',
                index === selectedIndex
                  ? 'bg-accent'
                  : 'hover:bg-muted/50'
              )}
              onClick={() => onSelect(response)}
              onMouseEnter={() => onHover(index)}
            >
              <div className="flex items-center gap-2 mb-1">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-sm">{response.shortcut}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {response.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {response.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Keyboard hints */}
      <div className="flex items-center gap-4 px-3 py-1.5 bg-muted/50 text-[10px] text-muted-foreground border-t">
        <span>
          <kbd className="px-1 py-0.5 bg-background rounded border text-[10px]">
            ↑↓
          </kbd>{' '}
          Navigate
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-background rounded border text-[10px]">
            ↵
          </kbd>{' '}
          Select
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-background rounded border text-[10px]">
            Esc
          </kbd>{' '}
          Close
        </span>
      </div>
    </div>
  )
}
