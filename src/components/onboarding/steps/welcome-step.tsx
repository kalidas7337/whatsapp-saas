'use client'

import { MessageSquare, Users, Zap, BarChart3, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WelcomeStepProps {
  onNext: () => void
}

const features = [
  {
    icon: MessageSquare,
    title: 'Team Inbox',
    description: 'Manage all WhatsApp conversations in one place',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Assign conversations and work together seamlessly',
  },
  {
    icon: Zap,
    title: 'Automation',
    description: 'Set up chatbots and automated responses',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Track performance with detailed insights',
  },
]

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
      {/* WhatsApp Logo */}
      <div className="w-20 h-20 bg-[#25D366] rounded-2xl flex items-center justify-center mb-6">
        <svg
          viewBox="0 0 24 24"
          className="w-12 h-12 text-white"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </div>

      {/* Welcome text */}
      <h1 className="text-3xl font-bold mb-3">
        Welcome to WhatsApp Business Platform
      </h1>
      <p className="text-muted-foreground text-lg mb-8">
        Set up your workspace in just a few minutes and start connecting with
        your customers on WhatsApp.
      </p>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 p-4 rounded-lg border bg-card text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Get started button */}
      <Button size="lg" onClick={onNext} className="gap-2">
        Get Started
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-xs text-muted-foreground mt-4">
        Takes about 3 minutes to complete
      </p>
    </div>
  )
}
