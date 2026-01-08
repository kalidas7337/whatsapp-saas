'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateRange, DateRangePreset } from '@/lib/analytics/types'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  dateRange: DateRange
  onPresetChange: (preset: DateRangePreset) => void
  onCustomRangeChange: (start: Date, end: Date) => void
  className?: string
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'thisQuarter', label: 'This quarter' },
  { value: 'lastQuarter', label: 'Last quarter' },
  { value: 'thisYear', label: 'This year' },
]

export function DateRangePicker({
  dateRange,
  onPresetChange,
  onCustomRangeChange,
  className,
}: DateRangePickerProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getPresetLabel = () => {
    if (dateRange.preset && dateRange.preset !== 'custom') {
      const preset = PRESETS.find((p) => p.value === dateRange.preset)
      return preset?.label || 'Custom'
    }
    return `${formatDateDisplay(dateRange.start)} - ${formatDateDisplay(dateRange.end)}`
  }

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart)
      const end = new Date(customEnd)
      if (start <= end) {
        onCustomRangeChange(start, end)
        setIsCustomOpen(false)
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-start text-left font-normal', className)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          <span>{getPresetLabel()}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px]" align="start">
        {/* Presets */}
        {PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset.value}
            onClick={() => onPresetChange(preset.value)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                'mr-2 h-4 w-4',
                dateRange.preset === preset.value ? 'opacity-100' : 'opacity-0'
              )}
            />
            {preset.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Custom Range Toggle */}
        <DropdownMenuItem
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          className="cursor-pointer"
        >
          <Check
            className={cn(
              'mr-2 h-4 w-4',
              dateRange.preset === 'custom' ? 'opacity-100' : 'opacity-0'
            )}
          />
          Custom range
        </DropdownMenuItem>

        {/* Custom Range Inputs */}
        {isCustomOpen && (
          <div className="p-3 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-xs">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-xs">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
            >
              Apply
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Comparison toggle component
interface ComparisonToggleProps {
  enabled: boolean
  type: 'previousPeriod' | 'previousYear'
  onToggle: () => void
  onTypeChange: (type: 'previousPeriod' | 'previousYear') => void
}

export function ComparisonToggle({
  enabled,
  type,
  onToggle,
  onTypeChange,
}: ComparisonToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={enabled ? 'default' : 'outline'}
        size="sm"
        onClick={onToggle}
        className="h-8"
      >
        <RotateCcw className="h-3 w-3 mr-1" />
        Compare
      </Button>

      {enabled && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              {type === 'previousPeriod' ? 'Previous period' : 'Previous year'}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onTypeChange('previousPeriod')}>
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  type === 'previousPeriod' ? 'opacity-100' : 'opacity-0'
                )}
              />
              Previous period
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTypeChange('previousYear')}>
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  type === 'previousYear' ? 'opacity-100' : 'opacity-0'
                )}
              />
              Previous year
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
