import { Metadata } from 'next'
import { Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contacts',
}

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your WhatsApp contacts
          </p>
        </div>
      </div>

      <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/50">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No contacts yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Import contacts or they will be created when customers message you
          </p>
        </div>
      </div>
    </div>
  )
}
