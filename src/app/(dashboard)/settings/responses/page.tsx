import { Metadata } from 'next'
import { ResponseManager } from '@/components/responses'

export const metadata: Metadata = {
  title: 'Quick Responses',
  description: 'Manage canned responses and quick reply shortcuts',
}

export default function ResponsesSettingsPage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quick Responses</h1>
        <p className="text-muted-foreground">
          Create and manage canned responses with dynamic variables and keyboard shortcuts
        </p>
      </div>
      <div className="h-[calc(100%-5rem)] border rounded-lg overflow-hidden">
        <ResponseManager />
      </div>
    </div>
  )
}
