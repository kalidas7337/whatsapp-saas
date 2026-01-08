/**
 * Analytics Module Exports
 * PROMPT 31: Advanced Analytics & Reporting System
 */

// Types
export * from './types'

// Services
export {
  AnalyticsService,
  createAnalyticsService,
  getDateRangeFromPreset,
  getComparisonDateRange,
} from './analytics.service'

// Export utilities
export {
  generateCSV,
  generateExcel,
  generatePDFContent,
  generateReport,
  downloadFile,
  createExportOptions,
} from './export.service'
export type { ReportData } from './export.service'
