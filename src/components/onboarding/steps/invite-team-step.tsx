'use client'

import { useState } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  UserPlus,
  X,
  Mail,
  Shield,
  Headphones,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TeamInvitation, TEAM_ROLE_OPTIONS } from '@/lib/onboarding/types'
import { cn } from '@/lib/utils'

interface InviteTeamStepProps {
  invitations: TeamInvitation[]
  onAddInvitation: (invitation: TeamInvitation) => void
  onRemoveInvitation: (email: string) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  isSaving: boolean
}

const roleIcons = {
  admin: Shield,
  agent: Headphones,
  viewer: Eye,
}

export function InviteTeamStep({
  invitations,
  onAddInvitation,
  onRemoveInvitation,
  onNext,
  onBack,
  onSkip,
  isSaving,
}: InviteTeamStepProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'admin' | 'agent' | 'viewer'>('agent')
  const [error, setError] = useState('')

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleAdd = () => {
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (invitations.some(i => i.email.toLowerCase() === email.toLowerCase())) {
      setError('This email has already been added')
      return
    }

    onAddInvitation({
      email: email.trim().toLowerCase(),
      name: name.trim() || undefined,
      role,
    })

    // Reset form
    setEmail('')
    setName('')
    setRole('agent')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Invite Your Team</h2>
        <p className="text-muted-foreground mt-2">
          Add team members to collaborate on customer conversations
        </p>
      </div>

      {/* Invitation Form */}
      <div className="space-y-4 p-4 rounded-lg border bg-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className={error ? 'border-destructive' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              placeholder="Team member name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <Label>Role</Label>
          <div className="grid grid-cols-3 gap-2">
            {TEAM_ROLE_OPTIONS.map((option) => {
              const Icon = roleIcons[option.value]
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={cn(
                    'p-3 rounded-lg border transition-all text-center',
                    role === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:border-primary/50'
                  )}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {TEAM_ROLE_OPTIONS.find(o => o.value === role)?.description}
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="w-full gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Team Member
        </Button>
      </div>

      {/* Invited Members List */}
      {invitations.length > 0 && (
        <div className="space-y-2">
          <Label>Pending Invitations ({invitations.length})</Label>
          <div className="space-y-2">
            {invitations.map((invitation) => {
              const Icon = roleIcons[invitation.role]
              return (
                <div
                  key={invitation.email}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {invitation.name || invitation.email}
                    </p>
                    {invitation.name && (
                      <p className="text-sm text-muted-foreground truncate">
                        {invitation.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="w-4 h-4" />
                    <span className="capitalize">{invitation.role}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveInvitation(invitation.email)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {invitations.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No team members added yet</p>
          <p className="text-sm">You can always invite team members later</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex gap-2">
          {invitations.length === 0 && (
            <Button variant="outline" onClick={onSkip}>
              Skip
            </Button>
          )}
          <Button
            onClick={onNext}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? 'Saving...' : 'Continue'}
            {!isSaving && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
