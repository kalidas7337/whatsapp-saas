'use client'

import { useState, useCallback } from 'react'
import {
  DateRange,
  ReportFormat,
  ReportType,
  ReportConfig,
  GeneratedReport,
} from '@/lib/analytics/types'

interface UseExportOptions {
  dateRange: DateRange
  reportType?: ReportType
}

interface UseExportReturn {
  // State
  isExporting: boolean
  progress: number
  error: string | null
  lastExport: GeneratedReport | null

  // Actions
  exportCSV: (filename?: string) => Promise<void>
  exportExcel: (filename?: string) => Promise<void>
  exportPDF: (filename?: string) => Promise<void>
  exportReport: (config: Partial<ReportConfig>) => Promise<void>
  cancelExport: () => void
}

export function useExport(options: UseExportOptions): UseExportReturn {
  const { dateRange, reportType = 'executive_summary' } = options

  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastExport, setLastExport] = useState<GeneratedReport | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const doExport = useCallback(
    async (format: ReportFormat, filename?: string): Promise<void> => {
      setIsExporting(true)
      setProgress(0)
      setError(null)

      const controller = new AbortController()
      setAbortController(controller)

      try {
        // Start export
        setProgress(10)

        const params = new URLSearchParams({
          format,
          reportType,
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
        })

        const response = await fetch(`/api/analytics/export?${params}`, {
          signal: controller.signal,
        })

        setProgress(50)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Export failed')
        }

        setProgress(75)

        // Get filename from headers
        const contentDisposition = response.headers.get('Content-Disposition')
        const serverFilename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : undefined

        const finalFilename =
          filename ||
          serverFilename ||
          `analytics-report-${Date.now()}.${format === 'pdf' ? 'html' : format}`

        // Download the file
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = finalFilename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setProgress(100)

        // Record last export
        setLastExport({
          id: `export-${Date.now()}`,
          type: reportType,
          name: finalFilename,
          dateRange,
          format,
          fileSize: blob.size,
          generatedAt: new Date(),
          status: 'completed',
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Export cancelled')
        } else {
          setError(err instanceof Error ? err.message : 'Export failed')
        }

        setLastExport({
          id: `export-${Date.now()}`,
          type: reportType,
          name: '',
          dateRange,
          format,
          generatedAt: new Date(),
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      } finally {
        setIsExporting(false)
        setAbortController(null)
      }
    },
    [dateRange, reportType]
  )

  const exportCSV = useCallback(
    (filename?: string) => doExport('csv', filename),
    [doExport]
  )

  const exportExcel = useCallback(
    (filename?: string) => doExport('excel', filename),
    [doExport]
  )

  const exportPDF = useCallback(
    (filename?: string) => doExport('pdf', filename),
    [doExport]
  )

  const exportReport = useCallback(
    async (config: Partial<ReportConfig>) => {
      const format = config.format || 'pdf'
      await doExport(format, config.name)
    },
    [doExport]
  )

  const cancelExport = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
  }, [abortController])

  return {
    isExporting,
    progress,
    error,
    lastExport,
    exportCSV,
    exportExcel,
    exportPDF,
    exportReport,
    cancelExport,
  }
}

// ============================================================================
// Scheduled Reports Hook
// ============================================================================

interface ScheduledReportInput {
  name: string
  config: ReportConfig
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    dayOfWeek?: number
    dayOfMonth?: number
    hour: number
    timezone: string
  }
  recipients: string[]
}

export function useScheduledReports() {
  const [reports, setReports] = useState<GeneratedReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics/scheduled-reports')
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()
      setReports(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createReport = useCallback(
    async (input: ScheduledReportInput): Promise<boolean> => {
      try {
        const response = await fetch('/api/analytics/scheduled-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        if (!response.ok) throw new Error('Failed to create')

        await fetchReports()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create')
        return false
      }
    },
    [fetchReports]
  )

  const deleteReport = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/analytics/scheduled-reports/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) throw new Error('Failed to delete')

        await fetchReports()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete')
        return false
      }
    },
    [fetchReports]
  )

  const toggleReport = useCallback(
    async (id: string, isActive: boolean): Promise<boolean> => {
      try {
        const response = await fetch(`/api/analytics/scheduled-reports/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        })

        if (!response.ok) throw new Error('Failed to update')

        await fetchReports()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update')
        return false
      }
    },
    [fetchReports]
  )

  return {
    reports,
    isLoading,
    error,
    fetchReports,
    createReport,
    deleteReport,
    toggleReport,
  }
}
