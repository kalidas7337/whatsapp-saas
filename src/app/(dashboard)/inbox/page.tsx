import { Metadata } from 'next'
import { MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Inbox',
}

export default function InboxPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Team Inbox</h1>
        <p className="text-muted-foreground mb-6">
          WhatsApp conversations will appear here once you connect your Business Account.
        </p>
        <p className="text-sm text-muted-foreground">
          Go to <span className="font-medium">Settings → WhatsApp</span> to connect your account.
        </p>
      </div>
    </div>
  )
}
