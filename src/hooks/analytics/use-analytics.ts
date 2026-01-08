'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  DateRange,
  DateRangePreset,
  ComparisonPeriod,
  ExecutiveDashboard,
  DashboardKPI,
  MetricTimeSeries,
  RealTimeMetrics,
  GroupByType,
  MetricType,
} from '@/lib/analytics/types'
import { getDateRangeFromPreset } from '@/lib/analytics'

interface UseAnalyticsOptions {
  initialPreset?: DateRangePreset
  enableComparison?: boolean
  comparisonType?: 'previousPeriod' | 'previousYear'
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

interface UseAnalyticsReturn {
  // State
  dateRange: DateRange
  comparison: ComparisonPeriod
  isLoading: boolean
  error: string | null

  // Dashboard Data
  dashboard: ExecutiveDashboard | null
  kpis: DashboardKPI[]
  trends: MetricTimeSeries[]
  realTimeMetrics: RealTimeMetrics | null

  // Actions
  setPreset: (preset: DateRangePreset) => void
  setCustomRange: (start: Date, end: Date) => void
  toggleComparison: () => void
  setComparisonType: (type: 'previousPeriod' | 'previousYear') => void
  refresh: () => Promise<void>

  // Utilities
  formatMetricValue: (value: number, unit: string) => string
  formatChange: (change: number) => string
}

export function useAnalytics(
  options: UseAnalyticsOptions = {}
): UseAnalyticsReturn {
  const {
    initialPreset = 'last7days',
    enableComparison = true,
    comparisonType = 'previousPeriod',
    autoRefresh = false,
    refreshInterval = 60000,
  } = options

  // State
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeFromPreset(initialPreset)
  )
  const [comparison, setComparison] = useState<ComparisonPeriod>({
    enabled: enableComparison,
    type: comparisonType,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<ExecutiveDashboard | null>(null)
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null)

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        comparisonEnabled: String(comparison.enabled),
        comparisonType: comparison.type,
      })

      const response = await fetch(`/api/analytics/dashboard?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setDashboard(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }, [dateRange, comparison])

  // Fetch real-time metrics
  const fetchRealTime = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/realtime')
      if (!response.ok) return

      const data = await response.json()
      setRealTimeMetrics(data.data)
    } catch {
      // Silent fail for real-time
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchRealTime()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchRealTime])

  // Actions
  const setPreset = useCallback((preset: DateRangePreset) => {
    setDateRange(getDateRangeFromPreset(preset))
  }, [])

  const setCustomRange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end, preset: 'custom' })
  }, [])

  const toggleComparison = useCallback(() => {
    setComparison(prev => ({ ...prev, enabled: !prev.enabled }))
  }, [])

  const setComparisonType = useCallback((type: 'previousPeriod' | 'previousYear') => {
    setComparison(prev => ({ ...prev, type }))
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([fetchDashboard(), fetchRealTime()])
  }, [fetchDashboard, fetchRealTime])

  // Derived data
  const kpis = useMemo(() => dashboard?.kpis || [], [dashboard])
  const trends = useMemo(() => dashboard?.trends || [], [dashboard])

  // Formatting utilities
  const formatMetricValue = useCallback((value: number, unit: string): string => {
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
  }, [])

  const formatChange = useCallback((change: number): string => {
    const prefix = change > 0 ? '+' : ''
    return `${prefix}${change.toFixed(1)}%`
  }, [])

  return {
    dateRange,
    comparison,
    isLoading,
    error,
    dashboard,
    kpis,
    trends,
    realTimeMetrics,
    setPreset,
    setCustomRange,
    toggleComparison,
    setComparisonType,
    refresh,
    formatMetricValue,
    formatChange,
  }
}

// ============================================================================
// Additional Hooks
// ============================================================================

/**
 * Hook for fetching specific metric time series
 */
export function useMetricTimeSeries(
  metric: MetricType,
  dateRange: DateRange,
  groupBy: GroupByType = 'day'
) {
  const [data, setData] = useState<MetricTimeSeries | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTimeSeries = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        metric,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        groupBy,
      })

      const response = await fetch(`/api/analytics/timeseries?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [metric, dateRange, groupBy])

  useEffect(() => {
    fetchTimeSeries()
  }, [fetchTimeSeries])

  return { data, isLoading, error, refresh: fetchTimeSeries }
}

/**
 * Hook for team performance analytics
 */
export function useTeamPerformance(dateRange: DateRange) {
  const [data, setData] = useState<{
    agents: Array<{
      agentId: string
      agentName: string
      messagesSent: number
      conversationsHandled: number
      avgResponseTime: number
      avgResolutionTime: number
    }>
    topPerformer: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTeamPerformance = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      })

      const response = await fetch(`/api/analytics/team?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchTeamPerformance()
  }, [fetchTeamPerformance])

  return { data, isLoading, error, refresh: fetchTeamPerformance }
}
