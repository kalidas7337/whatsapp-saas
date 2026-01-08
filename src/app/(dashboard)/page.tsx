import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Redirect to inbox as the default page
  redirect('/inbox')
}
