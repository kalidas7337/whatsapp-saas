/**
 * Analytics Service
 * PROMPT 31: Advanced Analytics & Reporting System
 */

import { prisma } from '@/lib/prisma'
import {
  DateRange,
  DateRangePreset,
  MetricType,
  MetricTimeSeries,
  TimeSeriesDataPoint,
  GroupByType,
  DashboardKPI,
  ConversationMetrics,
  MessageMetrics,
  AgentMetrics,
  TeamPerformance,
  TemplateAnalytics,
  ExecutiveDashboard,
  ComparisonPeriod,
  RealTimeMetrics,
} from './types'

// ============================================================================
// Date Range Utilities
// ============================================================================

export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let start: Date
  let end: Date = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) // End of today

  switch (preset) {
    case 'today':
      start = today
      break
    case 'yesterday':
      start = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      end = new Date(today.getTime() - 1)
      break
    case 'last7days':
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'last30days':
      start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      break
    case 'thisQuarter':
      const quarter = Math.floor(now.getMonth() / 3)
      start = new Date(now.getFullYear(), quarter * 3, 1)
      break
    case 'lastQuarter':
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1
      const yearOffset = lastQuarter < 0 ? -1 : 0
      const adjustedQuarter = lastQuarter < 0 ? 3 : lastQuarter
      start = new Date(now.getFullYear() + yearOffset, adjustedQuarter * 3, 1)
      end = new Date(now.getFullYear() + yearOffset, adjustedQuarter * 3 + 3, 0, 23, 59, 59)
      break
    case 'thisYear':
      start = new Date(now.getFullYear(), 0, 1)
      break
    default:
      start = today
  }

  return { start, end, preset }
}

export function getComparisonDateRange(
  dateRange: DateRange,
  comparison: ComparisonPeriod
): DateRange | null {
  if (!comparison.enabled) return null

  const duration = dateRange.end.getTime() - dateRange.start.getTime()

  if (comparison.type === 'custom' && comparison.range) {
    return comparison.range
  }

  if (comparison.type === 'previousYear') {
    return {
      start: new Date(dateRange.start.getFullYear() - 1, dateRange.start.getMonth(), dateRange.start.getDate()),
      end: new Date(dateRange.end.getFullYear() - 1, dateRange.end.getMonth(), dateRange.end.getDate()),
    }
  }

  // previousPeriod - same duration before start
  return {
    start: new Date(dateRange.start.getTime() - duration),
    end: new Date(dateRange.start.getTime() - 1),
  }
}

// ============================================================================
// Core Analytics Service
// ============================================================================

export class AnalyticsService {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  // --------------------------------------------------------------------------
  // Message Metrics
  // --------------------------------------------------------------------------

  async getMessageMetrics(
    dateRange: DateRange,
    _comparison?: ComparisonPeriod
  ): Promise<MessageMetrics> {
    const messages = await prisma.whatsapp_messages.findMany({
      where: {
        conversation: {
          organization_id: this.organizationId,
        },
        created_at: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: {
        direction: true,
        status: true,
        type: true,
        created_at: true,
      },
    })

    const sent = messages.filter(m => m.direction === 'OUTGOING').length
    const received = messages.filter(m => m.direction === 'INCOMING').length
    const delivered = messages.filter(m => m.status === 'DELIVERED' || m.status === 'READ').length
    const read = messages.filter(m => m.status === 'READ').length
    const failed = messages.filter(m => m.status === 'FAILED').length

    // Group by type
    const byType: Record<string, number> = {}
    messages.forEach(m => {
      const type = m.type || 'TEXT'
      byType[type] = (byType[type] || 0) + 1
    })

    // Group by hour (0-23)
    const byHour = Array(24).fill(0)
    messages.forEach(m => {
      const hour = m.created_at.getHours()
      byHour[hour]++
    })

    // Group by day of week
    const byDay: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    messages.forEach(m => {
      const day = dayNames[m.created_at.getDay()]
      byDay[day]++
    })

    return {
      sent,
      received,
      delivered,
      read,
      failed,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      readRate: delivered > 0 ? (read / delivered) * 100 : 0,
      byType,
      byHour,
      byDay,
    }
  }

  // --------------------------------------------------------------------------
  // Conversation Metrics
  // --------------------------------------------------------------------------

  async getConversationMetrics(dateRange: DateRange): Promise<ConversationMetrics> {
    const conversations = await prisma.whatsapp_conversations.findMany({
      where: {
        organization_id: this.organizationId,
        created_at: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: {
        status: true,
        created_at: true,
        updated_at: true,
        message_count: true,
        messages: {
          where: {
            direction: 'OUTGOING',
          },
          orderBy: { created_at: 'asc' },
          take: 1,
          select: {
            created_at: true,
          },
        },
      },
    })

    const total = conversations.length
    const active = conversations.filter(c => c.status === 'OPEN' || c.status === 'PENDING').length
    const resolved = conversations.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length

    // Calculate average response time (first reply to first message)
    let totalResponseTime = 0
    let responseCount = 0
    conversations.forEach(c => {
      if (c.messages.length > 0) {
        const responseTime = c.messages[0].created_at.getTime() - c.created_at.getTime()
        if (responseTime > 0 && responseTime < 24 * 60 * 60 * 1000) { // Only count if < 24h
          totalResponseTime += responseTime
          responseCount++
        }
      }
    })
    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0 // in seconds

    // Calculate average resolution time
    let totalResolutionTime = 0
    let resolutionCount = 0
    conversations.forEach(c => {
      if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
        const resolutionTime = c.updated_at.getTime() - c.created_at.getTime()
        if (resolutionTime > 0) {
          totalResolutionTime += resolutionTime
          resolutionCount++
        }
      }
    })
    const avgResolutionTime = resolutionCount > 0 ? totalResolutionTime / resolutionCount / 60000 : 0 // in minutes

    // Group by status
    const byStatus: Record<string, number> = {}
    conversations.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1
    })

    // We don't have priority in conversations, so using a placeholder
    const byPriority: Record<string, number> = {
      high: 0,
      medium: total,
      low: 0,
    }

    return {
      total,
      active,
      resolved,
      avgResolutionTime,
      avgResponseTime,
      byStatus,
      byPriority,
    }
  }

  // --------------------------------------------------------------------------
  // Agent Performance Metrics
  // --------------------------------------------------------------------------

  async getAgentMetrics(dateRange: DateRange): Promise<AgentMetrics[]> {
    // Get all conversations with assigned agents
    const conversations = await prisma.whatsapp_conversations.findMany({
      where: {
        organization_id: this.organizationId,
        assigned_to: { not: null },
        created_at: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: {
        id: true,
        assigned_to: true,
        status: true,
        created_at: true,
        updated_at: true,
        messages: {
          where: {
            direction: 'OUTGOING',
          },
          select: {
            created_at: true,
            sent_by_id: true,
          },
        },
      },
    })

    // Group by agent
    const agentData: Record<string, {
      agentId: string
      conversations: typeof conversations
      messages: number
    }> = {}

    conversations.forEach(conv => {
      if (conv.assigned_to) {
        if (!agentData[conv.assigned_to]) {
          agentData[conv.assigned_to] = {
            agentId: conv.assigned_to,
            conversations: [],
            messages: 0,
          }
        }
        agentData[conv.assigned_to].conversations.push(conv)
        agentData[conv.assigned_to].messages += conv.messages.length
      }
    })

    // Calculate metrics for each agent
    const agents: AgentMetrics[] = []
    for (const [agentId, data] of Object.entries(agentData)) {
      const resolvedConvs = data.conversations.filter(
        c => c.status === 'RESOLVED' || c.status === 'CLOSED'
      )
      const activeConvs = data.conversations.filter(
        c => c.status === 'OPEN' || c.status === 'PENDING'
      )

      // Calculate average response time
      let totalResponseTime = 0
      let responseCount = 0
      data.conversations.forEach(c => {
        if (c.messages.length > 0) {
          const responseTime = c.messages[0].created_at.getTime() - c.created_at.getTime()
          if (responseTime > 0 && responseTime < 24 * 60 * 60 * 1000) {
            totalResponseTime += responseTime
            responseCount++
          }
        }
      })

      // Calculate average resolution time
      let totalResolutionTime = 0
      resolvedConvs.forEach(c => {
        totalResolutionTime += c.updated_at.getTime() - c.created_at.getTime()
      })

      agents.push({
        agentId,
        agentName: `Agent ${agentId.slice(0, 8)}`, // Would need user lookup for real name
        messagesSent: data.messages,
        conversationsHandled: data.conversations.length,
        avgResponseTime: responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0,
        avgResolutionTime: resolvedConvs.length > 0 ? totalResolutionTime / resolvedConvs.length / 60000 : 0,
        customerSatisfaction: 0, // Would need CSAT data
        activeConversations: activeConvs.length,
      })
    }

    return agents.sort((a, b) => b.conversationsHandled - a.conversationsHandled)
  }

  async getTeamPerformance(dateRange: DateRange): Promise<TeamPerformance> {
    const agents = await this.getAgentMetrics(dateRange)
    const messageMetrics = await this.getMessageMetrics(dateRange)
    const conversationMetrics = await this.getConversationMetrics(dateRange)

    const topPerformer = agents.length > 0 ? agents[0] : null
    const totalAgents = agents.length

    return {
      agents,
      topPerformer,
      avgResponseTime: totalAgents > 0
        ? agents.reduce((sum, a) => sum + a.avgResponseTime, 0) / totalAgents
        : 0,
      avgResolutionTime: totalAgents > 0
        ? agents.reduce((sum, a) => sum + a.avgResolutionTime, 0) / totalAgents
        : 0,
      totalConversations: conversationMetrics.total,
      totalMessages: messageMetrics.sent + messageMetrics.received,
    }
  }

  // --------------------------------------------------------------------------
  // Template Analytics
  // --------------------------------------------------------------------------

  async getTemplateAnalytics(dateRange: DateRange): Promise<TemplateAnalytics[]> {
    // Get messages with template info
    const templateMessages = await prisma.whatsapp_messages.findMany({
      where: {
        conversation: {
          organization_id: this.organizationId,
        },
        template_name: { not: null },
        created_at: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: {
        template_name: true,
        status: true,
      },
    })

    // Group by template
    const templateData: Record<string, {
      count: number
      delivered: number
      read: number
      replied: number
    }> = {}

    templateMessages.forEach(m => {
      if (!m.template_name) return
      if (!templateData[m.template_name]) {
        templateData[m.template_name] = {
          count: 0,
          delivered: 0,
          read: 0,
          replied: 0,
        }
      }
      templateData[m.template_name].count++
      if (m.status === 'DELIVERED' || m.status === 'READ') {
        templateData[m.template_name].delivered++
      }
      if (m.status === 'READ') {
        templateData[m.template_name].read++
      }
    })

    return Object.entries(templateData).map(([name, data]) => ({
      templateId: name,
      templateName: name,
      category: 'General',
      usageCount: data.count,
      deliveryRate: data.count > 0 ? (data.delivered / data.count) * 100 : 0,
      readRate: data.delivered > 0 ? (data.read / data.delivered) * 100 : 0,
      responseRate: data.delivered > 0 ? (data.replied / data.delivered) * 100 : 0,
    })).sort((a, b) => b.usageCount - a.usageCount)
  }

  // --------------------------------------------------------------------------
  // Time Series Data
  // --------------------------------------------------------------------------

  async getTimeSeries(
    metric: MetricType,
    dateRange: DateRange,
    groupBy: GroupByType = 'day'
  ): Promise<MetricTimeSeries> {
    const messages = await prisma.whatsapp_messages.findMany({
      where: {
        conversation: {
          organization_id: this.organizationId,
        },
        created_at: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: {
        direction: true,
        status: true,
        created_at: true,
      },
    })

    // Filter based on metric type
    const filteredMessages = messages.filter(m => {
      switch (metric) {
        case 'messages_sent':
          return m.direction === 'OUTGOING'
        case 'messages_received':
          return m.direction === 'INCOMING'
        case 'messages_delivered':
          return m.status === 'DELIVERED' || m.status === 'READ'
        case 'messages_read':
          return m.status === 'READ'
        case 'messages_failed':
          return m.status === 'FAILED'
        default:
          return true
      }
    })

    // Group by time period
    const dataPoints: Map<string, number> = new Map()
    filteredMessages.forEach(m => {
      const key = this.getTimeKey(m.created_at, groupBy)
      dataPoints.set(key, (dataPoints.get(key) || 0) + 1)
    })

    // Convert to array and sort
    const data: TimeSeriesDataPoint[] = Array.from(dataPoints.entries())
      .map(([key, value]) => ({
        timestamp: this.parseTimeKey(key, groupBy),
        value,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    const values = data.map(d => d.value)
    return {
      metric,
      data,
      total: values.reduce((sum, v) => sum + v, 0),
      average: values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0,
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
    }
  }

  private getTimeKey(date: Date, groupBy: GroupByType): string {
    switch (groupBy) {
      case 'hour':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
      case 'day':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`
      case 'month':
        return `${date.getFullYear()}-${date.getMonth()}`
      case 'quarter':
        return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
      case 'year':
        return `${date.getFullYear()}`
      default:
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    }
  }

  private parseTimeKey(key: string, groupBy: GroupByType): Date {
    const parts = key.split('-')
    switch (groupBy) {
      case 'hour':
        return new Date(+parts[0], +parts[1], +parts[2], +parts[3])
      case 'day':
      case 'week':
        return new Date(+parts[0], +parts[1], +parts[2])
      case 'month':
        return new Date(+parts[0], +parts[1], 1)
      case 'quarter':
        const quarter = parseInt(parts[1].replace('Q', '')) - 1
        return new Date(+parts[0], quarter * 3, 1)
      case 'year':
        return new Date(+parts[0], 0, 1)
      default:
        return new Date(+parts[0], +parts[1] || 0, +parts[2] || 1)
    }
  }

  // --------------------------------------------------------------------------
  // KPI Calculations
  // --------------------------------------------------------------------------

  async getKPIs(
    dateRange: DateRange,
    comparison?: ComparisonPeriod
  ): Promise<DashboardKPI[]> {
    const messageMetrics = await this.getMessageMetrics(dateRange)
    const conversationMetrics = await this.getConversationMetrics(dateRange)

    let prevMessageMetrics: MessageMetrics | null = null
    let prevConversationMetrics: ConversationMetrics | null = null

    if (comparison?.enabled) {
      const comparisonRange = getComparisonDateRange(dateRange, comparison)
      if (comparisonRange) {
        prevMessageMetrics = await this.getMessageMetrics(comparisonRange)
        prevConversationMetrics = await this.getConversationMetrics(comparisonRange)
      }
    }

    const calculateChange = (current: number, previous: number | undefined): {
      changePercent: number
      trend: 'up' | 'down' | 'stable'
    } => {
      if (previous === undefined || previous === 0) {
        return { changePercent: 0, trend: 'stable' }
      }
      const change = ((current - previous) / previous) * 100
      return {
        changePercent: Math.round(change * 10) / 10,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      }
    }

    const kpis: DashboardKPI[] = [
      {
        id: 'total_messages',
        metric: 'messages_sent',
        label: 'Total Messages',
        value: messageMetrics.sent + messageMetrics.received,
        previousValue: prevMessageMetrics
          ? prevMessageMetrics.sent + prevMessageMetrics.received
          : undefined,
        ...calculateChange(
          messageMetrics.sent + messageMetrics.received,
          prevMessageMetrics ? prevMessageMetrics.sent + prevMessageMetrics.received : undefined
        ),
        unit: 'messages',
      },
      {
        id: 'delivery_rate',
        metric: 'messages_delivered',
        label: 'Delivery Rate',
        value: Math.round(messageMetrics.deliveryRate * 10) / 10,
        previousValue: prevMessageMetrics
          ? Math.round(prevMessageMetrics.deliveryRate * 10) / 10
          : undefined,
        ...calculateChange(messageMetrics.deliveryRate, prevMessageMetrics?.deliveryRate),
        unit: '%',
      },
      {
        id: 'read_rate',
        metric: 'messages_read',
        label: 'Read Rate',
        value: Math.round(messageMetrics.readRate * 10) / 10,
        previousValue: prevMessageMetrics
          ? Math.round(prevMessageMetrics.readRate * 10) / 10
          : undefined,
        ...calculateChange(messageMetrics.readRate, prevMessageMetrics?.readRate),
        unit: '%',
      },
      {
        id: 'conversations',
        metric: 'conversations_started',
        label: 'Conversations',
        value: conversationMetrics.total,
        previousValue: prevConversationMetrics?.total,
        ...calculateChange(conversationMetrics.total, prevConversationMetrics?.total),
        unit: 'conversations',
      },
      {
        id: 'avg_response_time',
        metric: 'avg_response_time',
        label: 'Avg Response Time',
        value: Math.round(conversationMetrics.avgResponseTime),
        previousValue: prevConversationMetrics
          ? Math.round(prevConversationMetrics.avgResponseTime)
          : undefined,
        ...calculateChange(
          conversationMetrics.avgResponseTime,
          prevConversationMetrics?.avgResponseTime
        ),
        unit: 'seconds',
      },
      {
        id: 'resolution_rate',
        metric: 'conversations_resolved',
        label: 'Resolution Rate',
        value: conversationMetrics.total > 0
          ? Math.round((conversationMetrics.resolved / conversationMetrics.total) * 1000) / 10
          : 0,
        previousValue: prevConversationMetrics && prevConversationMetrics.total > 0
          ? Math.round(
              (prevConversationMetrics.resolved / prevConversationMetrics.total) * 1000
            ) / 10
          : undefined,
        ...calculateChange(
          conversationMetrics.total > 0
            ? (conversationMetrics.resolved / conversationMetrics.total) * 100
            : 0,
          prevConversationMetrics && prevConversationMetrics.total > 0
            ? (prevConversationMetrics.resolved / prevConversationMetrics.total) * 100
            : undefined
        ),
        unit: '%',
      },
    ]

    return kpis
  }

  // --------------------------------------------------------------------------
  // Real-time Metrics
  // --------------------------------------------------------------------------

  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)

    // Active conversations
    const activeConversations = await prisma.whatsapp_conversations.count({
      where: {
        organization_id: this.organizationId,
        status: 'OPEN',
      },
    })

    // Pending messages (sent but not delivered)
    const pendingMessages = await prisma.whatsapp_messages.count({
      where: {
        conversation: {
          organization_id: this.organizationId,
        },
        status: 'PENDING',
        direction: 'OUTGOING',
      },
    })

    // Messages in the last minute
    const recentMessages = await prisma.whatsapp_messages.count({
      where: {
        conversation: {
          organization_id: this.organizationId,
        },
        created_at: {
          gte: oneMinuteAgo,
        },
      },
    })

    // Average wait time for pending conversations
    const pendingConversations = await prisma.whatsapp_conversations.findMany({
      where: {
        organization_id: this.organizationId,
        status: 'PENDING',
      },
      select: {
        created_at: true,
      },
    })

    const avgWaitTime = pendingConversations.length > 0
      ? pendingConversations.reduce(
          (sum, c) => sum + (now.getTime() - c.created_at.getTime()),
          0
        ) / pendingConversations.length / 1000
      : 0

    return {
      activeConversations,
      onlineAgents: 0, // Would need real-time presence tracking
      pendingMessages,
      avgWaitTime: Math.round(avgWaitTime),
      messagesPerMinute: recentMessages,
      timestamp: now,
    }
  }

  // --------------------------------------------------------------------------
  // Executive Dashboard
  // --------------------------------------------------------------------------

  async getExecutiveDashboard(
    dateRange: DateRange,
    comparison?: ComparisonPeriod
  ): Promise<ExecutiveDashboard> {
    const [kpis, conversations, messages, teamPerformance, templates, messagesTrend, conversationsTrend] =
      await Promise.all([
        this.getKPIs(dateRange, comparison),
        this.getConversationMetrics(dateRange),
        this.getMessageMetrics(dateRange),
        this.getTeamPerformance(dateRange),
        this.getTemplateAnalytics(dateRange),
        this.getTimeSeries('messages_sent', dateRange, 'day'),
        this.getTimeSeries('conversations_started', dateRange, 'day'),
      ])

    return {
      dateRange,
      comparison,
      kpis,
      conversations,
      messages,
      teamPerformance,
      templates: templates.slice(0, 10), // Top 10
      trends: [messagesTrend, conversationsTrend],
    }
  }

  // --------------------------------------------------------------------------
  // Contact Metrics
  // --------------------------------------------------------------------------

  async getContactMetrics(dateRange: DateRange): Promise<{
    total: number
    new: number
    active: number
    optedIn: number
    blocked: number
  }> {
    const contacts = await prisma.whatsapp_contacts.findMany({
      where: {
        organization_id: this.organizationId,
      },
      select: {
        created_at: true,
        last_message_at: true,
        opted_in: true,
        is_blocked: true,
      },
    })

    const total = contacts.length
    const newContacts = contacts.filter(
      c => c.created_at >= dateRange.start && c.created_at <= dateRange.end
    ).length
    const active = contacts.filter(
      c => c.last_message_at && c.last_message_at >= dateRange.start
    ).length
    const optedIn = contacts.filter(c => c.opted_in).length
    const blocked = contacts.filter(c => c.is_blocked).length

    return {
      total,
      new: newContacts,
      active,
      optedIn,
      blocked,
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAnalyticsService(organizationId: string): AnalyticsService {
  return new AnalyticsService(organizationId)
}
