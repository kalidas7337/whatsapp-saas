'use client'

import {
  CheckCircle2,
  MessageSquare,
  Users,
  FileText,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OnboardingData } from '@/lib/onboarding/types'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface CompleteStepProps {
  data: OnboardingData
  onComplete: () => void
  isCompleting: boolean
}

const quickActions = [
  {
    title: 'Start a Conversation',
    description: 'Send your first WhatsApp message',
    icon: MessageSquare,
    href: '/inbox',
    primary: true,
  },
  {
    title: 'Import Contacts',
    description: 'Add your customer contacts',
    icon: Users,
    href: '/contacts',
  },
  {
    title: 'Create Templates',
    description: 'Set up message templates',
    icon: FileText,
    href: '/templates',
  },
  {
    title: 'Build Automation',
    description: 'Create automated responses',
    icon: Zap,
    href: '/flows',
  },
]

export function CompleteStep({
  data,
  onComplete,
  isCompleting,
}: CompleteStepProps) {
  // Trigger confetti on mount
  useEffect(() => {
    const duration = 2000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#25D366', '#128C7E', '#075E54'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#25D366', '#128C7E', '#075E54'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  const getSummaryItems = () => {
    const items = []

    if (data.businessInfo) {
      items.push({
        label: 'Business',
        value: data.businessInfo.businessName,
      })
    }

    if (data.whatsappSetup?.verificationStatus === 'verified') {
      items.push({
        label: 'WhatsApp',
        value: 'Connected',
      })
    }

    if (data.teamInvitations.length > 0) {
      items.push({
        label: 'Team Members',
        value: `${data.teamInvitations.length} invited`,
      })
    }

    return items
  }

  const summaryItems = getSummaryItems()

  return (
    <div className="space-y-8 max-w-xl mx-auto text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h2 className="text-2xl font-bold mb-2">You&apos;re All Set!</h2>
        <p className="text-muted-foreground">
          Your WhatsApp Business workspace is ready. Start engaging with your
          customers today.
        </p>
      </div>

      {/* Setup Summary */}
      {summaryItems.length > 0 && (
        <div className="flex justify-center gap-6">
          {summaryItems.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={onComplete}
              className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all hover:border-primary/50 ${
                action.primary
                  ? 'bg-primary/5 border-primary'
                  : 'bg-card border-input'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  action.primary
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium">{action.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Complete Button */}
      <Button
        size="lg"
        onClick={onComplete}
        disabled={isCompleting}
        className="gap-2"
      >
        {isCompleting ? 'Completing...' : 'Go to Dashboard'}
        {!isCompleting && <ArrowRight className="w-4 h-4" />}
      </Button>
    </div>
  )
}
