/**
 * Export Service - CSV, Excel, PDF Generation
 * PROMPT 31: Advanced Analytics & Reporting System
 */

import {
  ReportFormat,
  ExportOptions,
  ExportResult,
  DateRange,
  MessageMetrics,
  ConversationMetrics,
  AgentMetrics,
  TemplateAnalytics,
  DashboardKPI,
} from './types'

// ============================================================================
// CSV Export
// ============================================================================

export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
): string {
  if (data.length === 0) return ''

  const columns = options.columns || Object.keys(data[0])
  const lines: string[] = []

  // Header row
  if (options.includeHeaders) {
    lines.push(columns.map(col => escapeCSV(String(col))).join(','))
  }

  // Data rows
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col]
      if (value === null || value === undefined) return ''
      if (value instanceof Date) {
        return formatDate(value, options.dateFormat)
      }
      return escapeCSV(String(value))
    })
    lines.push(values.join(','))
  })

  return lines.join('\n')
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDate(date: Date, format: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

// ============================================================================
// Excel Export (Simple XML-based XLSX)
// ============================================================================

export function generateExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions,
  sheetName: string = 'Report'
): string {
  if (data.length === 0) return ''

  const columns = options.columns || Object.keys(data[0])
  const rows: string[][] = []

  // Header row
  if (options.includeHeaders) {
    rows.push(columns.map(col => String(col)))
  }

  // Data rows
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col]
      if (value === null || value === undefined) return ''
      if (value instanceof Date) {
        return formatDate(value, options.dateFormat)
      }
      return String(value)
    })
    rows.push(values)
  })

  return generateSpreadsheetML(rows, sheetName)
}

function generateSpreadsheetML(rows: string[][], _sheetName: string): string {
  const cells = rows.map((row, rowIndex) => {
    return row.map((cell, colIndex) => {
      const colLetter = getColumnLetter(colIndex)
      const cellRef = `${colLetter}${rowIndex + 1}`
      const isNumber = !isNaN(Number(cell)) && cell !== ''

      if (isNumber) {
        return `<c r="${cellRef}"><v>${cell}</v></c>`
      }
      return `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXML(cell)}</t></is></c>`
    }).join('')
  }).map((rowContent, i) => `<row r="${i + 1}">${rowContent}</row>`).join('')

  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${cells}</sheetData>
</worksheet>`

  return worksheet
}

function getColumnLetter(index: number): string {
  let letter = ''
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter
    index = Math.floor(index / 26) - 1
  }
  return letter
}

function escapeXML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ============================================================================
// PDF Export (HTML-based for server-side rendering)
// ============================================================================

export function generatePDFContent(
  title: string,
  dateRange: DateRange,
  sections: ReportSection[],
  options: ExportOptions
): string {
  const formattedStart = formatDate(dateRange.start, options.dateFormat)
  const formattedEnd = formatDate(dateRange.end, options.dateFormat)

  const sectionsHtml = sections.map(section => {
    if (section.type === 'kpis') {
      return generateKPIsSection(section.data as DashboardKPI[])
    }
    if (section.type === 'table') {
      return generateTableSection(section.title, section.data as Record<string, unknown>[], section.columns)
    }
    if (section.type === 'summary') {
      return generateSummarySection(section.title, section.data as Record<string, string | number>)
    }
    return ''
  }).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeXML(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      color: #1e40af;
      font-size: 24px;
    }
    .header .date-range {
      color: #6b7280;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #1f2937;
      font-size: 16px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .kpi-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
    }
    .kpi-label {
      color: #6b7280;
      font-size: 11px;
      text-transform: uppercase;
    }
    .kpi-value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }
    .kpi-change {
      font-size: 12px;
    }
    .kpi-change.positive { color: #16a34a; }
    .kpi-change.negative { color: #dc2626; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .summary-list {
      background: #f9fafb;
      border-radius: 8px;
      padding: 15px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .summary-item:last-child {
      border-bottom: none;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 10px;
      text-align: center;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeXML(title)}</h1>
    <div class="date-range">Report Period: ${formattedStart} - ${formattedEnd}</div>
  </div>

  ${sectionsHtml}

  <div class="footer">
    Generated on ${formatDate(new Date(), options.dateFormat)} | WhatsApp Analytics Report
  </div>
</body>
</html>
`
}

interface ReportSection {
  type: 'kpis' | 'table' | 'summary'
  title: string
  data: unknown
  columns?: string[]
}

function generateKPIsSection(kpis: DashboardKPI[]): string {
  const kpiCards = kpis.map(kpi => {
    const changeClass = kpi.trend === 'up' ? 'positive' : kpi.trend === 'down' ? 'negative' : ''
    const changeIcon = kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'
    const changeText = kpi.changePercent ? `${changeIcon} ${Math.abs(kpi.changePercent)}%` : ''

    return `
      <div class="kpi-card">
        <div class="kpi-label">${escapeXML(kpi.label)}</div>
        <div class="kpi-value">${formatValue(kpi.value, kpi.unit)}</div>
        ${changeText ? `<div class="kpi-change ${changeClass}">${changeText}</div>` : ''}
      </div>
    `
  }).join('')

  return `
    <div class="section">
      <h2>Key Performance Indicators</h2>
      <div class="kpi-grid">${kpiCards}</div>
    </div>
  `
}

function generateTableSection(title: string, data: Record<string, unknown>[], columns?: string[]): string {
  if (data.length === 0) return ''

  const cols = columns || Object.keys(data[0])
  const headerRow = cols.map(col => `<th>${escapeXML(formatColumnName(col))}</th>`).join('')
  const dataRows = data.map(row => {
    const cells = cols.map(col => `<td>${formatCellValue(row[col])}</td>`).join('')
    return `<tr>${cells}</tr>`
  }).join('')

  return `
    <div class="section">
      <h2>${escapeXML(title)}</h2>
      <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${dataRows}</tbody>
      </table>
    </div>
  `
}

function generateSummarySection(title: string, data: Record<string, string | number>): string {
  const items = Object.entries(data).map(([key, value]) => `
    <div class="summary-item">
      <span>${escapeXML(formatColumnName(key))}</span>
      <strong>${formatCellValue(value)}</strong>
    </div>
  `).join('')

  return `
    <div class="section">
      <h2>${escapeXML(title)}</h2>
      <div class="summary-list">${items}</div>
    </div>
  `
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (value instanceof Date) return formatDate(value, 'YYYY-MM-DD')
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString()
    return value.toFixed(2)
  }
  return escapeXML(String(value))
}

function formatValue(value: number, unit: string): string {
  if (unit === '%') return `${value}%`
  if (unit === 'seconds') return value >= 60 ? `${Math.round(value / 60)}m` : `${value}s`
  if (unit === 'minutes') return value >= 60 ? `${(value / 60).toFixed(1)}h` : `${Math.round(value)}m`
  return value.toLocaleString()
}

// ============================================================================
// Report Generator
// ============================================================================

export interface ReportData {
  title: string
  dateRange: DateRange
  kpis?: DashboardKPI[]
  messageMetrics?: MessageMetrics
  conversationMetrics?: ConversationMetrics
  agentMetrics?: AgentMetrics[]
  templateAnalytics?: TemplateAnalytics[]
}

export function generateReport(
  data: ReportData,
  format: ReportFormat,
  options: ExportOptions
): ExportResult {
  try {
    let content: string
    let filename: string

    switch (format) {
      case 'csv':
        content = generateReportCSV(data, options)
        filename = options.filename || `report-${Date.now()}.csv`
        break
      case 'excel':
        content = generateReportExcel(data, options)
        filename = options.filename || `report-${Date.now()}.xlsx`
        break
      case 'pdf':
        content = generateReportPDF(data, options)
        filename = options.filename || `report-${Date.now()}.html`
        break
      default:
        throw new Error(`Unsupported format: ${format}`)
    }

    return {
      success: true,
      filename,
      fileSize: new Blob([content]).size,
      rowCount: data.agentMetrics?.length || data.templateAnalytics?.length || 0,
    }
  } catch (error) {
    return {
      success: false,
      filename: '',
      fileSize: 0,
      rowCount: 0,
      error: error instanceof Error ? error.message : 'Export failed',
    }
  }
}

function generateReportCSV(data: ReportData, options: ExportOptions): string {
  const lines: string[] = []

  // KPIs section
  if (data.kpis && data.kpis.length > 0) {
    lines.push('# Key Performance Indicators')
    lines.push(generateCSV(
      data.kpis.map(k => ({
        Metric: k.label,
        Value: k.value,
        Unit: k.unit,
        Change: k.changePercent ? `${k.changePercent}%` : 'N/A',
        Trend: k.trend,
      })),
      options
    ))
    lines.push('')
  }

  // Message Metrics section
  if (data.messageMetrics) {
    lines.push('# Message Metrics')
    lines.push(generateCSV([{
      'Sent': data.messageMetrics.sent,
      'Received': data.messageMetrics.received,
      'Delivered': data.messageMetrics.delivered,
      'Read': data.messageMetrics.read,
      'Failed': data.messageMetrics.failed,
      'Delivery Rate': `${data.messageMetrics.deliveryRate.toFixed(1)}%`,
      'Read Rate': `${data.messageMetrics.readRate.toFixed(1)}%`,
    }], options))
    lines.push('')
  }

  // Agent Metrics section
  if (data.agentMetrics && data.agentMetrics.length > 0) {
    lines.push('# Agent Performance')
    lines.push(generateCSV(
      data.agentMetrics.map(a => ({
        Agent: a.agentName,
        'Messages Sent': a.messagesSent,
        'Conversations': a.conversationsHandled,
        'Avg Response Time (s)': a.avgResponseTime.toFixed(0),
        'Avg Resolution Time (m)': a.avgResolutionTime.toFixed(0),
        'Active': a.activeConversations,
      })),
      options
    ))
    lines.push('')
  }

  // Template Analytics section
  if (data.templateAnalytics && data.templateAnalytics.length > 0) {
    lines.push('# Template Performance')
    lines.push(generateCSV(
      data.templateAnalytics.map(t => ({
        Template: t.templateName,
        Category: t.category,
        'Usage Count': t.usageCount,
        'Delivery Rate': `${t.deliveryRate.toFixed(1)}%`,
        'Read Rate': `${t.readRate.toFixed(1)}%`,
      })),
      options
    ))
  }

  return lines.join('\n')
}

function generateReportExcel(data: ReportData, options: ExportOptions): string {
  // For now, generate a simple CSV-like structure
  // A full Excel implementation would use a library like xlsx
  return generateReportCSV(data, options)
}

function generateReportPDF(data: ReportData, options: ExportOptions): string {
  const sections: ReportSection[] = []

  if (data.kpis) {
    sections.push({
      type: 'kpis',
      title: 'Key Performance Indicators',
      data: data.kpis,
    })
  }

  if (data.messageMetrics) {
    sections.push({
      type: 'summary',
      title: 'Message Metrics',
      data: {
        'Messages Sent': data.messageMetrics.sent,
        'Messages Received': data.messageMetrics.received,
        'Delivered': data.messageMetrics.delivered,
        'Read': data.messageMetrics.read,
        'Failed': data.messageMetrics.failed,
        'Delivery Rate': `${data.messageMetrics.deliveryRate.toFixed(1)}%`,
        'Read Rate': `${data.messageMetrics.readRate.toFixed(1)}%`,
      },
    })
  }

  if (data.agentMetrics && data.agentMetrics.length > 0) {
    sections.push({
      type: 'table',
      title: 'Agent Performance',
      data: data.agentMetrics.map(a => ({
        agent: a.agentName,
        messages: a.messagesSent,
        conversations: a.conversationsHandled,
        responseTime: `${a.avgResponseTime.toFixed(0)}s`,
        resolutionTime: `${a.avgResolutionTime.toFixed(0)}m`,
        active: a.activeConversations,
      })),
      columns: ['agent', 'messages', 'conversations', 'responseTime', 'resolutionTime', 'active'],
    })
  }

  if (data.templateAnalytics && data.templateAnalytics.length > 0) {
    sections.push({
      type: 'table',
      title: 'Template Performance',
      data: data.templateAnalytics.map(t => ({
        template: t.templateName,
        category: t.category,
        usage: t.usageCount,
        deliveryRate: `${t.deliveryRate.toFixed(1)}%`,
        readRate: `${t.readRate.toFixed(1)}%`,
      })),
      columns: ['template', 'category', 'usage', 'deliveryRate', 'readRate'],
    })
  }

  return generatePDFContent(data.title, data.dateRange, sections, options)
}

// ============================================================================
// Export Utilities
// ============================================================================

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function createExportOptions(
  format: ReportFormat,
  filename?: string
): ExportOptions {
  return {
    format,
    filename,
    includeHeaders: true,
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}
