import { Metadata } from 'next'
import { AnalyticsDashboard } from '@/components/analytics'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Advanced analytics and reporting for WhatsApp messaging',
}

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <AnalyticsDashboard />
    </div>
  )
}
