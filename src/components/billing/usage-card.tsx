'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { UsageRecord, Plan } from '@/lib/billing/types'

interface UsageCardProps {
  usage: UsageRecord
  plan: Plan
}

export function UsageCard({ usage, plan }: UsageCardProps) {
  const getUsageColor = (percent: number): string => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 75) return 'bg-amber-500'
    return 'bg-primary'
  }

  const teamMemberPercent = plan.limits.teamMembers
    ? (usage.teamMembersCount / plan.limits.teamMembers) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage This Month</CardTitle>
        <CardDescription>Your current usage for {usage.month}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Messages */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Messages Sent</span>
            <span>
              {usage.messagesSent.toLocaleString()}
              {usage.messagesLimit && (
                <span className="text-muted-foreground">
                  {' '}
                  / {usage.messagesLimit.toLocaleString()}
                </span>
              )}
            </span>
          </div>
          {usage.messagesLimit && (
            <Progress
              value={usage.percentUsed}
              className="h-2"
              indicatorClassName={getUsageColor(usage.percentUsed)}
            />
          )}
          {usage.percentUsed >= 90 && (
            <p className="text-xs text-destructive">
              You&apos;ve almost reached your message limit. Consider upgrading.
            </p>
          )}
        </div>

        {/* Team Members */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Team Members</span>
            <span>
              {usage.teamMembersCount}
              {plan.limits.teamMembers && (
                <span className="text-muted-foreground">
                  {' '}
                  / {plan.limits.teamMembers}
                </span>
              )}
            </span>
          </div>
          {plan.limits.teamMembers && (
            <Progress
              value={teamMemberPercent}
              className="h-2"
              indicatorClassName={
                teamMemberPercent >= 100 ? 'bg-red-500' : undefined
              }
            />
          )}
        </div>

        {/* Conversations */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Conversations</span>
            <span>{usage.conversationsCount.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
