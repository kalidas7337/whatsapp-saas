'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BusinessInfo,
  INDUSTRY_OPTIONS,
  TEAM_SIZE_OPTIONS,
  USE_CASE_OPTIONS,
} from '@/lib/onboarding/types'
import { cn } from '@/lib/utils'

interface BusinessInfoStepProps {
  initialData: BusinessInfo | null
  onNext: (data: BusinessInfo) => void
  onBack: () => void
  isSaving: boolean
}

export function BusinessInfoStep({
  initialData,
  onNext,
  onBack,
  isSaving,
}: BusinessInfoStepProps) {
  const [businessName, setBusinessName] = useState(initialData?.businessName || '')
  const [industry, setIndustry] = useState(initialData?.industry || '')
  const [teamSize, setTeamSize] = useState(initialData?.teamSize || '')
  const [useCases, setUseCases] = useState<string[]>(initialData?.useCases || [])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setBusinessName(initialData.businessName || '')
      setIndustry(initialData.industry || '')
      setTeamSize(initialData.teamSize || '')
      setUseCases(initialData.useCases || [])
    }
  }, [initialData])

  const toggleUseCase = (value: string) => {
    setUseCases(prev =>
      prev.includes(value)
        ? prev.filter(uc => uc !== value)
        : [...prev, value]
    )
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }
    if (!industry) {
      newErrors.industry = 'Please select an industry'
    }
    if (!teamSize) {
      newErrors.teamSize = 'Please select your team size'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      onNext({
        businessName: businessName.trim(),
        industry,
        teamSize,
        useCases,
      })
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Tell us about your business</h2>
        <p className="text-muted-foreground mt-2">
          This helps us personalize your experience
        </p>
      </div>

      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          placeholder="Enter your business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className={errors.businessName ? 'border-destructive' : ''}
        />
        {errors.businessName && (
          <p className="text-sm text-destructive">{errors.businessName}</p>
        )}
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <Label>Industry</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {INDUSTRY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setIndustry(option.value)}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border transition-all text-left',
                industry === option.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-input hover:border-primary/50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.industry && (
          <p className="text-sm text-destructive">{errors.industry}</p>
        )}
      </div>

      {/* Team Size */}
      <div className="space-y-2">
        <Label>Team Size</Label>
        <div className="grid grid-cols-3 gap-2">
          {TEAM_SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTeamSize(option.value)}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border transition-all',
                teamSize === option.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-input hover:border-primary/50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.teamSize && (
          <p className="text-sm text-destructive">{errors.teamSize}</p>
        )}
      </div>

      {/* Use Cases */}
      <div className="space-y-2">
        <Label>How will you use WhatsApp? (optional)</Label>
        <p className="text-sm text-muted-foreground">
          Select all that apply
        </p>
        <div className="grid grid-cols-2 gap-2">
          {USE_CASE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleUseCase(option.value)}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border transition-all flex items-center gap-2',
                useCases.includes(option.value)
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-input hover:border-primary/50'
              )}
            >
              {useCases.includes(option.value) && (
                <Check className="w-4 h-4" />
              )}
              <span className="flex-1 text-left">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={isSaving} className="gap-2">
          {isSaving ? 'Saving...' : 'Continue'}
          {!isSaving && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}
