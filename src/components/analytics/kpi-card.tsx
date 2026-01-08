'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { DashboardKPI } from '@/lib/analytics/types'

interface KPICardProps {
  kpi: DashboardKPI
  className?: string
}

export function KPICard({ kpi, className }: KPICardProps) {
  const TrendIcon =
    kpi.trend === 'up'
      ? TrendingUp
      : kpi.trend === 'down'
      ? TrendingDown
      : Minus

  // Format value based on unit
  const formatValue = (value: number, unit: string): string => {
    if (unit === '%') return `${value.toFixed(1)}%`
    if (unit === 'seconds') {
      if (value >= 3600) return `${(value / 3600).toFixed(1)}h`
      if (value >= 60) return `${Math.round(value / 60)}m`
      return `${Math.round(value)}s`
    }
    if (unit === 'minutes') {
      if (value >= 60) return `${(value / 60).toFixed(1)}h`
      return `${Math.round(value)}m`
    }
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toLocaleString()
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold">{formatValue(kpi.value, kpi.unit)}</p>
          </div>

          {kpi.changePercent !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                kpi.trend === 'up'
                  ? 'bg-green-100 text-green-700'
                  : kpi.trend === 'down'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {Math.abs(kpi.changePercent).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Progress bar for targets */}
        {kpi.targetValue && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{kpi.targetPercent?.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(kpi.targetPercent || 0, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Previous value comparison */}
        {kpi.previousValue !== undefined && (
          <p className="mt-2 text-xs text-muted-foreground">
            Previous: {formatValue(kpi.previousValue, kpi.unit)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Grid layout for multiple KPIs
interface KPIGridProps {
  kpis: DashboardKPI[]
  columns?: 2 | 3 | 4 | 6
  className?: string
}

export function KPIGrid({ kpis, columns = 3, className }: KPIGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  )
}
