import { Metadata } from 'next'
import Link from 'next/link'
import { User, Users, CreditCard, Key, MessageSquare, Bell, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Settings',
}

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    description: 'Manage your account settings and profile',
    href: '/settings/account',
    icon: User,
  },
  {
    title: 'Team',
    description: 'Invite team members and manage roles',
    href: '/settings/team',
    icon: Users,
  },
  {
    title: 'Billing',
    description: 'View your subscription and billing history',
    href: '/settings/billing',
    icon: CreditCard,
  },
  {
    title: 'WhatsApp',
    description: 'Connect and configure your WhatsApp Business Account',
    href: '/settings/whatsapp',
    icon: MessageSquare,
  },
  {
    title: 'Quick Responses',
    description: 'Manage canned responses and quick reply shortcuts',
    href: '/settings/responses',
    icon: Zap,
  },
  {
    title: 'API Keys',
    description: 'Manage API keys for external integrations',
    href: '/settings/api',
    icon: Key,
  },
  {
    title: 'Notifications',
    description: 'Configure notification preferences',
    href: '/settings/notifications',
    icon: Bell,
  },
]

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
