'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, Settings, User, Building2, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface UserMenuProps {
  user: {
    name: string | null
    email: string
    image: string | null
    organizationName: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="flex items-center gap-2 h-auto py-2"
        onClick={() => setOpen(!open)}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image || undefined} alt={user.name || ''} />
          <AvatarFallback>
            {user.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || user.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium">{user.name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{user.organizationName}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-lg border shadow-lg z-50">
            <div className="p-3 border-b">
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>

            <div className="p-1">
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                onClick={() => setOpen(false)}
              >
                <Building2 className="h-4 w-4" />
                {user.organizationName}
              </Link>

              <Link
                href="/settings/account"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                onClick={() => setOpen(false)}
              >
                <User className="h-4 w-4" />
                Account
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>

            <div className="p-1 border-t">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
