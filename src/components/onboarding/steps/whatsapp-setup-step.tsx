'use client'

import { useState, useEffect } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Link2,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WhatsAppSetupInfo } from '@/lib/onboarding/types'
import { cn } from '@/lib/utils'

interface WhatsAppSetupStepProps {
  initialData: WhatsAppSetupInfo | null
  onNext: (data: WhatsAppSetupInfo) => void
  onBack: () => void
  onSkip: () => void
  isSaving: boolean
}

type ConnectionMethod = 'existing' | 'new' | 'skip'

const connectionOptions: {
  value: ConnectionMethod
  title: string
  description: string
  icon: typeof MessageSquare
}[] = [
  {
    value: 'existing',
    title: 'Connect Existing Account',
    description: 'I already have a WhatsApp Business Account',
    icon: Link2,
  },
  {
    value: 'new',
    title: 'Create New Account',
    description: "I'll set up a new WhatsApp Business Account",
    icon: MessageSquare,
  },
  {
    value: 'skip',
    title: 'Skip for Now',
    description: "I'll connect WhatsApp later",
    icon: Clock,
  },
]

export function WhatsAppSetupStep({
  initialData,
  onNext,
  onBack,
  onSkip,
  isSaving,
}: WhatsAppSetupStepProps) {
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>(
    initialData?.connectionMethod || 'existing'
  )
  const [wabaId, setWabaId] = useState(initialData?.wabaId || '')
  const [phoneNumberId, setPhoneNumberId] = useState(initialData?.phoneNumberId || '')
  const [businessPhoneNumber, setBusinessPhoneNumber] = useState(
    initialData?.businessPhoneNumber || ''
  )
  const [displayName, setDisplayName] = useState(initialData?.displayName || '')
  const [verificationStatus, setVerificationStatus] = useState<
    'pending' | 'verified' | 'failed' | undefined
  >(initialData?.verificationStatus)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setConnectionMethod(initialData.connectionMethod || 'existing')
      setWabaId(initialData.wabaId || '')
      setPhoneNumberId(initialData.phoneNumberId || '')
      setBusinessPhoneNumber(initialData.businessPhoneNumber || '')
      setDisplayName(initialData.displayName || '')
      setVerificationStatus(initialData.verificationStatus)
    }
  }, [initialData])

  const handleVerify = async () => {
    setErrors({})

    if (!wabaId.trim()) {
      setErrors({ wabaId: 'WABA ID is required' })
      return
    }
    if (!phoneNumberId.trim()) {
      setErrors({ phoneNumberId: 'Phone Number ID is required' })
      return
    }

    setIsVerifying(true)

    // Simulate verification (in real app, this would call WhatsApp API)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // For demo purposes, always succeed
    setVerificationStatus('verified')
    setIsVerifying(false)
  }

  const handleNext = () => {
    if (connectionMethod === 'skip') {
      onSkip()
      return
    }

    if (connectionMethod === 'existing' && verificationStatus !== 'verified') {
      setErrors({ general: 'Please verify your WhatsApp Business Account first' })
      return
    }

    onNext({
      connectionMethod,
      wabaId: wabaId.trim() || undefined,
      phoneNumberId: phoneNumberId.trim() || undefined,
      businessPhoneNumber: businessPhoneNumber.trim() || undefined,
      displayName: displayName.trim() || undefined,
      verificationStatus,
    })
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Connect WhatsApp</h2>
        <p className="text-muted-foreground mt-2">
          Link your WhatsApp Business Account to start messaging
        </p>
      </div>

      {/* Connection Method Selection */}
      <div className="space-y-3">
        {connectionOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setConnectionMethod(option.value)
              setErrors({})
              setVerificationStatus(undefined)
            }}
            className={cn(
              'w-full p-4 rounded-lg border transition-all flex items-start gap-4 text-left',
              connectionMethod === option.value
                ? 'border-primary bg-primary/5'
                : 'border-input hover:border-primary/50'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                connectionMethod === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <option.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium">{option.title}</h3>
              <p className="text-sm text-muted-foreground">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Existing Account Form */}
      {connectionMethod === 'existing' && (
        <div className="space-y-4 p-4 rounded-lg border bg-card">
          <div className="space-y-2">
            <Label htmlFor="wabaId">WhatsApp Business Account ID</Label>
            <Input
              id="wabaId"
              placeholder="e.g., 123456789012345"
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
              className={errors.wabaId ? 'border-destructive' : ''}
              disabled={verificationStatus === 'verified'}
            />
            {errors.wabaId && (
              <p className="text-sm text-destructive">{errors.wabaId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumberId">Phone Number ID</Label>
            <Input
              id="phoneNumberId"
              placeholder="e.g., 123456789012345"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              className={errors.phoneNumberId ? 'border-destructive' : ''}
              disabled={verificationStatus === 'verified'}
            />
            {errors.phoneNumberId && (
              <p className="text-sm text-destructive">{errors.phoneNumberId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessPhoneNumber">
              Business Phone Number (optional)
            </Label>
            <Input
              id="businessPhoneNumber"
              placeholder="e.g., +91 98765 43210"
              value={businessPhoneNumber}
              onChange={(e) => setBusinessPhoneNumber(e.target.value)}
              disabled={verificationStatus === 'verified'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name (optional)</Label>
            <Input
              id="displayName"
              placeholder="Your business display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={verificationStatus === 'verified'}
            />
          </div>

          {/* Verification Status */}
          {verificationStatus === 'verified' ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">WhatsApp account verified!</span>
            </div>
          ) : verificationStatus === 'failed' ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">
                Verification failed. Please check your credentials.
              </span>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying ? 'Verifying...' : 'Verify Connection'}
            </Button>
          )}

          {errors.general && (
            <p className="text-sm text-destructive text-center">
              {errors.general}
            </p>
          )}
        </div>
      )}

      {/* New Account Info */}
      {connectionMethod === 'new' && (
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-2">Create a WhatsApp Business Account</h4>
          <p className="text-sm text-muted-foreground mb-4">
            You&apos;ll be redirected to Facebook Business Manager to create
            your WhatsApp Business Account. This typically takes 5-10 minutes.
          </p>
          <Button variant="outline" className="w-full" asChild>
            <a
              href="https://business.facebook.com/latest/whatsapp_manager"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Facebook Business Manager
            </a>
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={
            isSaving ||
            (connectionMethod === 'existing' && verificationStatus !== 'verified')
          }
          className="gap-2"
        >
          {isSaving ? 'Saving...' : connectionMethod === 'skip' ? 'Skip' : 'Continue'}
          {!isSaving && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}
