'use client'

import { useAnalytics } from '@/hooks/analytics'
import { KPIGrid } from './kpi-card'
import { DateRangePicker, ComparisonToggle } from './date-range-picker'
import { MetricsChart, LineChart, DonutChart } from './metrics-chart'
import { ExportButton } from './export-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  RefreshCw,
  Loader2,
  AlertCircle,
  Users,
  MessageSquare,
  Clock,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const {
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
  } = useAnalytics({
    initialPreset: 'last7days',
    enableComparison: true,
    autoRefresh: true,
    refreshInterval: 60000,
  })

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Track your WhatsApp messaging performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker
            dateRange={dateRange}
            onPresetChange={setPreset}
            onCustomRangeChange={setCustomRange}
          />
          <ComparisonToggle
            enabled={comparison.enabled}
            type={comparison.type === 'custom' ? 'previousPeriod' : comparison.type}
            onToggle={toggleComparison}
            onTypeChange={setComparisonType}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <ExportButton dateRange={dateRange} />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Real-time Stats Bar */}
      {realTimeMetrics && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium">Live</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>{realTimeMetrics.activeConversations} active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{realTimeMetrics.onlineAgents} online</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatMetricValue(realTimeMetrics.avgWaitTime, 'seconds')} wait</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>{realTimeMetrics.messagesPerMinute}/min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !dashboard && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Dashboard Content */}
      {dashboard && (
        <>
          {/* KPIs */}
          <KPIGrid kpis={kpis} columns={3} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Messages Trend */}
            {trends[0] && (
              <MetricsChart
                title="Messages Over Time"
                data={trends[0]}
                color="#2563eb"
              />
            )}

            {/* Conversations Trend */}
            {trends[1] && (
              <LineChart
                title="Conversations Trend"
                data={trends[1]}
                color="#16a34a"
                fillColor="rgba(22, 163, 74, 0.1)"
              />
            )}
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message Types Distribution */}
            <DonutChart
              title="Message Types"
              data={Object.entries(dashboard.messages.byType).map(([label, value]) => ({
                label,
                value,
              }))}
            />

            {/* Conversation Status Distribution */}
            <DonutChart
              title="Conversation Status"
              data={Object.entries(dashboard.conversations.byStatus).map(
                ([label, value]) => ({
                  label: formatStatus(label),
                  value,
                })
              )}
            />

            {/* Message Activity by Day */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Activity by Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(dashboard.messages.byDay).map(([day, count]) => {
                    const max = Math.max(...Object.values(dashboard.messages.byDay))
                    const percent = max > 0 ? (count / max) * 100 : 0

                    return (
                      <div key={day} className="flex items-center gap-2">
                        <span className="w-20 text-xs text-muted-foreground">
                          {day.slice(0, 3)}
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-12 text-xs text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.teamPerformance.agents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No agent data available
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b">
                        <th className="text-left py-2">Agent</th>
                        <th className="text-right py-2">Messages</th>
                        <th className="text-right py-2">Conversations</th>
                        <th className="text-right py-2">Avg Response</th>
                        <th className="text-right py-2">Resolution</th>
                        <th className="text-right py-2">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.teamPerformance.agents.map((agent, i) => (
                        <tr key={agent.agentId} className="border-b last:border-0">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                {agent.agentName.charAt(0)}
                              </div>
                              <span className="font-medium text-sm">{agent.agentName}</span>
                              {i === 0 && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Top
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-right text-sm">{agent.messagesSent}</td>
                          <td className="text-right text-sm">{agent.conversationsHandled}</td>
                          <td className="text-right text-sm">
                            {formatMetricValue(agent.avgResponseTime, 'seconds')}
                          </td>
                          <td className="text-right text-sm">
                            {formatMetricValue(agent.avgResolutionTime, 'minutes')}
                          </td>
                          <td className="text-right text-sm">
                            <Badge
                              variant={agent.activeConversations > 0 ? 'default' : 'secondary'}
                            >
                              {agent.activeConversations}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Template Performance */}
          {dashboard.templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.templates.slice(0, 5).map((template) => (
                    <div
                      key={template.templateId}
                      className="flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {template.templateName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {template.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <p className="font-medium">{template.usageCount}</p>
                          <p className="text-xs text-muted-foreground">Uses</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{template.deliveryRate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Delivery</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{template.readRate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Read</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^./, (s) => s.toUpperCase())
}
