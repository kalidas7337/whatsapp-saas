/**
 * Analytics Export API
 * PROMPT 31: Advanced Analytics & Reporting
 *
 * GET /api/analytics/export - Export analytics report
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAnalyticsService, createExportOptions } from '@/lib/analytics'
import { ReportFormat, ReportType } from '@/lib/analytics/types'

const VALID_FORMATS: ReportFormat[] = ['csv', 'excel', 'pdf']
const VALID_REPORT_TYPES: ReportType[] = [
  'executive_summary',
  'conversation_report',
  'message_report',
  'agent_performance',
  'template_analytics',
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { organizationId?: string }
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') as ReportFormat) || 'csv'
    const reportType = (searchParams.get('reportType') as ReportType) || 'executive_summary'
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    // Validate format
    if (!VALID_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Valid values: ${VALID_FORMATS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate report type
    if (!VALID_REPORT_TYPES.includes(reportType)) {
      return NextResponse.json(
        { error: `Invalid reportType. Valid values: ${VALID_REPORT_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Parse dates
    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    const dateRange = { start: startDate, end: endDate }

    // Get analytics data
    const analyticsService = createAnalyticsService(user.organizationId)

    const [
      kpis,
      messageMetrics,
      conversationMetrics,
      agentMetrics,
      templateAnalytics,
    ] = await Promise.all([
      analyticsService.getKPIs(dateRange),
      analyticsService.getMessageMetrics(dateRange),
      analyticsService.getConversationMetrics(dateRange),
      analyticsService.getAgentMetrics(dateRange),
      analyticsService.getTemplateAnalytics(dateRange),
    ])

    // Generate report
    const exportOptions = createExportOptions(format)
    const reportData = {
      title: `Analytics Report - ${reportType}`,
      dateRange,
      kpis,
      messageMetrics,
      conversationMetrics,
      agentMetrics,
      templateAnalytics,
    }

    // Generate content based on format
    let content: string
    let mimeType: string
    let filename: string

    const timestamp = Date.now()

    switch (format) {
      case 'csv':
        content = generateCSVContent(reportData)
        mimeType = 'text/csv'
        filename = `analytics-report-${timestamp}.csv`
        break
      case 'excel':
        content = generateCSVContent(reportData) // Using CSV for Excel for simplicity
        mimeType = 'text/csv'
        filename = `analytics-report-${timestamp}.csv`
        break
      case 'pdf':
        content = generateHTMLContent(reportData, exportOptions)
        mimeType = 'text/html'
        filename = `analytics-report-${timestamp}.html`
        break
      default:
        content = generateCSVContent(reportData)
        mimeType = 'text/csv'
        filename = `analytics-report-${timestamp}.csv`
    }

    // Return file
    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export report', message: (error as Error).message },
      { status: 500 }
    )
  }
}

// Helper functions for content generation
function generateCSVContent(data: {
  kpis: Array<{ label: string; value: number; unit: string; changePercent?: number }>
  messageMetrics: { sent: number; received: number; delivered: number; read: number; failed: number }
  agentMetrics: Array<{ agentName: string; messagesSent: number; conversationsHandled: number; avgResponseTime: number }>
  templateAnalytics: Array<{ templateName: string; usageCount: number; deliveryRate: number; readRate: number }>
}): string {
  const lines: string[] = []

  // KPIs Section
  lines.push('# Key Performance Indicators')
  lines.push('Metric,Value,Unit,Change')
  data.kpis.forEach((kpi) => {
    lines.push(`${kpi.label},${kpi.value},${kpi.unit},${kpi.changePercent || 'N/A'}%`)
  })
  lines.push('')

  // Message Metrics Section
  lines.push('# Message Metrics')
  lines.push('Sent,Received,Delivered,Read,Failed')
  lines.push(
    `${data.messageMetrics.sent},${data.messageMetrics.received},${data.messageMetrics.delivered},${data.messageMetrics.read},${data.messageMetrics.failed}`
  )
  lines.push('')

  // Agent Metrics Section
  if (data.agentMetrics.length > 0) {
    lines.push('# Agent Performance')
    lines.push('Agent,Messages Sent,Conversations,Avg Response Time (s)')
    data.agentMetrics.forEach((agent) => {
      lines.push(
        `${agent.agentName},${agent.messagesSent},${agent.conversationsHandled},${agent.avgResponseTime.toFixed(0)}`
      )
    })
    lines.push('')
  }

  // Template Analytics Section
  if (data.templateAnalytics.length > 0) {
    lines.push('# Template Performance')
    lines.push('Template,Usage Count,Delivery Rate,Read Rate')
    data.templateAnalytics.forEach((template) => {
      lines.push(
        `${template.templateName},${template.usageCount},${template.deliveryRate.toFixed(1)}%,${template.readRate.toFixed(1)}%`
      )
    })
  }

  return lines.join('\n')
}

function generateHTMLContent(
  data: {
    title: string
    dateRange: { start: Date; end: Date }
    kpis: Array<{ label: string; value: number; unit: string }>
    messageMetrics: { sent: number; received: number; delivered: number }
  },
  _options: { dateFormat: string }
): string {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>
    body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1e40af; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    .date-range { color: #6b7280; margin-bottom: 30px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #1f2937; font-size: 18px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
    .kpi-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
    .kpi-label { color: #6b7280; font-size: 12px; }
    .kpi-value { font-size: 24px; font-weight: bold; }
    .footer { margin-top: 40px; color: #9ca3af; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  <div class="date-range">${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}</div>

  <div class="section">
    <h2>Key Performance Indicators</h2>
    <div class="kpi-grid">
      ${data.kpis.map((kpi) => `
        <div class="kpi-card">
          <div class="kpi-label">${kpi.label}</div>
          <div class="kpi-value">${kpi.value}${kpi.unit === '%' ? '%' : ''}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="section">
    <h2>Message Summary</h2>
    <p>Sent: ${data.messageMetrics.sent} | Received: ${data.messageMetrics.received} | Delivered: ${data.messageMetrics.delivered}</p>
  </div>

  <div class="footer">Generated on ${new Date().toLocaleDateString()}</div>
</body>
</html>
  `
}
