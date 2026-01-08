'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricTimeSeries } from '@/lib/analytics/types'

interface MetricsChartProps {
  title: string
  data: MetricTimeSeries | null
  color?: string
  showValues?: boolean
  className?: string
}

export function MetricsChart({
  title,
  data,
  color = '#2563eb',
  showValues = true,
  className,
}: MetricsChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) return null

    const values = data.data.map((d) => d.value)
    const max = Math.max(...values, 1) // Ensure we don't divide by 0
    const min = Math.min(...values)

    return {
      points: data.data,
      max,
      min,
      total: data.total,
      average: data.average,
    }
  }, [data])

  if (!chartData) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {showValues && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Total: {chartData.total.toLocaleString()}</span>
              <span>Avg: {chartData.average.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Bar Chart */}
        <div className="h-[200px] flex items-end gap-1">
          {chartData.points.map((point, index) => {
            const height = (point.value / chartData.max) * 100
            const label = formatDateLabel(point.timestamp)

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                {/* Bar */}
                <div className="w-full relative flex items-end h-[160px]">
                  <div
                    className="w-full rounded-t transition-all duration-200 group-hover:opacity-80"
                    style={{
                      height: `${Math.max(height, 2)}%`,
                      backgroundColor: color,
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 shadow-md border whitespace-nowrap">
                      <div className="font-medium">{point.value.toLocaleString()}</div>
                      <div className="text-muted-foreground">{label}</div>
                    </div>
                  </div>
                </div>
                {/* X-axis label */}
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {chartData.points.length <= 14 ? label : index % 2 === 0 ? label : ''}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function formatDateLabel(date: Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Line chart variant using SVG
interface LineChartProps {
  title: string
  data: MetricTimeSeries | null
  color?: string
  fillColor?: string
  className?: string
}

export function LineChart({
  title,
  data,
  color = '#2563eb',
  fillColor = 'rgba(37, 99, 235, 0.1)',
  className,
}: LineChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) return null

    const values = data.data.map((d) => d.value)
    const max = Math.max(...values, 1)
    const min = Math.min(...values)
    const range = max - min || 1

    const points = data.data.map((d, i) => ({
      x: (i / (data.data.length - 1 || 1)) * 100,
      y: 100 - ((d.value - min) / range) * 100,
      value: d.value,
      date: d.timestamp,
    }))

    return { points, max, min, total: data.total, average: data.average }
  }, [data])

  if (!chartData) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Generate path
  const linePath = chartData.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const areaPath = `${linePath} L ${chartData.points[chartData.points.length - 1].x} 100 L 0 100 Z`

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Total: {chartData.total.toLocaleString()}</span>
            <span>Avg: {chartData.average.toFixed(1)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] relative">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.1"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Area fill */}
            <path d={areaPath} fill={fillColor} />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            {/* Data points */}
            {chartData.points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="white"
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer hover:r-4"
              />
            ))}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-muted-foreground -ml-8">
            <span>{chartData.max.toLocaleString()}</span>
            <span>{chartData.min.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Donut chart for distribution
interface DonutChartProps {
  title: string
  data: { label: string; value: number; color?: string }[]
  className?: string
}

export function DonutChart({ title, data, className }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const defaultColors = [
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#f59e0b',
    '#8b5cf6',
    '#06b6d4',
  ]

  // Calculate segments
  let currentAngle = -90 // Start at top
  const segments = data.map((d, i) => {
    const percentage = total > 0 ? (d.value / total) * 100 : 0
    const angle = (percentage / 100) * 360
    const startAngle = currentAngle
    currentAngle += angle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = ((startAngle + angle) * Math.PI) / 180
    const largeArc = angle > 180 ? 1 : 0

    const x1 = 50 + 40 * Math.cos(startRad)
    const y1 = 50 + 40 * Math.sin(startRad)
    const x2 = 50 + 40 * Math.cos(endRad)
    const y2 = 50 + 40 * Math.sin(endRad)

    return {
      ...d,
      color: d.color || defaultColors[i % defaultColors.length],
      percentage,
      path: angle >= 360
        ? `M 50 10 A 40 40 0 1 1 49.99 10`
        : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
    }
  })

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Chart */}
          <div className="relative w-[140px] h-[140px]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {segments.map((seg, i) => (
                <path
                  key={i}
                  d={seg.path}
                  fill={seg.color}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
              {/* Center hole */}
              <circle cx="50" cy="50" r="25" fill="white" />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold">{total.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="flex-1 truncate">{seg.label}</span>
                <span className="text-muted-foreground">
                  {seg.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
