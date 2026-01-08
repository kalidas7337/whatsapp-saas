/**
 * Analytics & Reporting Types
 * PROMPT 31: Advanced Analytics System
 */

// ============================================================================
// Date Range Types
// ============================================================================

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'custom'

export interface DateRange {
  start: Date
  end: Date
  preset?: DateRangePreset
}

export interface ComparisonPeriod {
  enabled: boolean
  type: 'previousPeriod' | 'previousYear' | 'custom'
  range?: DateRange
}

// ============================================================================
// Metric Types
// ============================================================================

export type MetricType =
  | 'messages_sent'
  | 'messages_received'
  | 'messages_delivered'
  | 'messages_read'
  | 'messages_failed'
  | 'conversations_started'
  | 'conversations_resolved'
  | 'avg_response_time'
  | 'avg_resolution_time'
  | 'active_contacts'
  | 'new_contacts'
  | 'templates_used'
  | 'automation_triggered'
  | 'agent_messages'
  | 'customer_satisfaction'

export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count'

export type GroupByType = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface MetricDefinition {
  id: MetricType
  name: string
  description: string
  unit: 'count' | 'percentage' | 'seconds' | 'minutes' | 'hours'
  aggregation: AggregationType
  icon: string
  color: string
}

export interface MetricValue {
  metric: MetricType
  value: number
  previousValue?: number
  changePercent?: number
  trend: 'up' | 'down' | 'stable'
}

export interface TimeSeriesDataPoint {
  timestamp: Date
  value: number
}

export interface MetricTimeSeries {
  metric: MetricType
  data: TimeSeriesDataPoint[]
  total: number
  average: number
  min: number
  max: number
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardKPI {
  id: string
  metric: MetricType
  label: string
  value: number
  previousValue?: number
  changePercent?: number
  trend: 'up' | 'down' | 'stable'
  targetValue?: number
  targetPercent?: number
  unit: string
}

export interface ConversationMetrics {
  total: number
  active: number
  resolved: number
  avgResolutionTime: number // in minutes
  avgResponseTime: number // in seconds
  byStatus: Record<string, number>
  byPriority: Record<string, number>
}

export interface MessageMetrics {
  sent: number
  received: number
  delivered: number
  read: number
  failed: number
  deliveryRate: number
  readRate: number
  byType: Record<string, number>
  byHour: number[]
  byDay: Record<string, number>
}

export interface AgentMetrics {
  agentId: string
  agentName: string
  messagesSent: number
  conversationsHandled: number
  avgResponseTime: number
  avgResolutionTime: number
  customerSatisfaction: number
  activeConversations: number
}

export interface TeamPerformance {
  agents: AgentMetrics[]
  topPerformer: AgentMetrics | null
  avgResponseTime: number
  avgResolutionTime: number
  totalConversations: number
  totalMessages: number
}

export interface TemplateAnalytics {
  templateId: string
  templateName: string
  category: string
  usageCount: number
  deliveryRate: number
  readRate: number
  responseRate: number
}

export interface ExecutiveDashboard {
  dateRange: DateRange
  comparison?: ComparisonPeriod
  kpis: DashboardKPI[]
  conversations: ConversationMetrics
  messages: MessageMetrics
  teamPerformance: TeamPerformance
  templates: TemplateAnalytics[]
  trends: MetricTimeSeries[]
}

// ============================================================================
// Report Types
// ============================================================================

export type ReportFormat = 'pdf' | 'excel' | 'csv'

export type ReportType =
  | 'executive_summary'
  | 'conversation_report'
  | 'message_report'
  | 'agent_performance'
  | 'template_analytics'
  | 'custom'

export interface ReportConfig {
  type: ReportType
  name: string
  description: string
  dateRange: DateRange
  comparison?: ComparisonPeriod
  metrics: MetricType[]
  groupBy?: GroupByType
  filters?: Record<string, unknown>
  format: ReportFormat
  includeCharts: boolean
  includeSummary: boolean
}

export interface ScheduledReport {
  id: string
  organizationId: string
  name: string
  config: ReportConfig
  schedule: ReportSchedule
  recipients: string[]
  isActive: boolean
  lastRun?: Date
  nextRun?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  hour: number // 0-23
  timezone: string
}

export interface GeneratedReport {
  id: string
  reportId?: string
  type: ReportType
  name: string
  dateRange: DateRange
  format: ReportFormat
  fileUrl?: string
  fileSize?: number
  generatedAt: Date
  expiresAt?: Date
  status: 'pending' | 'generating' | 'completed' | 'failed'
  error?: string
}

// ============================================================================
// Filter Types
// ============================================================================

export interface AnalyticsFilters {
  dateRange: DateRange
  comparison?: ComparisonPeriod
  agentIds?: string[]
  templateIds?: string[]
  conversationStatuses?: string[]
  messageTypes?: string[]
  tags?: string[]
}

// ============================================================================
// Chart Types
// ============================================================================

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'heatmap'

export interface ChartConfig {
  type: ChartType
  title: string
  metric: MetricType
  groupBy: GroupByType
  showComparison: boolean
  colors?: string[]
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string
  fill?: boolean
}

// ============================================================================
// Real-time Metrics
// ============================================================================

export interface RealTimeMetrics {
  activeConversations: number
  onlineAgents: number
  pendingMessages: number
  avgWaitTime: number
  messagesPerMinute: number
  timestamp: Date
}

export interface LiveStats {
  current: RealTimeMetrics
  history: RealTimeMetrics[] // Last 60 data points (1 hour at 1 min intervals)
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportOptions {
  format: ReportFormat
  filename?: string
  includeHeaders: boolean
  dateFormat: string
  timezone: string
  columns?: string[]
}

export interface ExportResult {
  success: boolean
  filename: string
  fileUrl?: string
  fileSize: number
  rowCount: number
  error?: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AnalyticsResponse<T> {
  success: boolean
  data?: T
  error?: string
  generatedAt: Date
  cacheHit?: boolean
}

export interface PaginatedAnalytics<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
