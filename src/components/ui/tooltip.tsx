'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProviderProps {
  children: React.ReactNode
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>
}

interface TooltipProps {
  children: React.ReactNode
}

export function Tooltip({ children }: TooltipProps) {
  return <div className="relative inline-block">{children}</div>
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function TooltipTrigger({ children }: TooltipTriggerProps) {
  return <div className="group cursor-help">{children}</div>
}

interface TooltipContentProps {
  children: React.ReactNode
  className?: string
}

export function TooltipContent({ children, className }: TooltipContentProps) {
  return (
    <div
      className={cn(
        'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs bg-popover text-popover-foreground rounded-md shadow-md border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap',
        className
      )}
    >
      {children}
    </div>
  )
}
