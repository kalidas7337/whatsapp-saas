'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  OnboardingData,
  OnboardingStep,
  BusinessInfo,
  WhatsAppSetupInfo,
  TeamInvitation,
  OnboardingProgress,
  StepValidation,
  ONBOARDING_STEPS,
} from '@/lib/onboarding/types'

// Default onboarding data
const createDefaultOnboardingData = (): OnboardingData => ({
  currentStep: 'welcome',
  completedSteps: [],
  businessInfo: null,
  whatsappSetup: null,
  teamInvitations: [],
  startedAt: new Date(),
})

export function useOnboarding() {
  const router = useRouter()
  const [data, setData] = useState<OnboardingData>(createDefaultOnboardingData())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch onboarding data on mount
  useEffect(() => {
    fetchOnboardingData()
  }, [])

  const fetchOnboardingData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/onboarding')
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setData(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch onboarding data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Save data to server
  const saveData = async (updatedData: Partial<OnboardingData>) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        throw new Error('Failed to save onboarding data')
      }

      const result = await response.json()
      setData(result.data)
      return result.data
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
      toast.error('Failed to save progress')
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Get current step index
  const currentStepIndex = ONBOARDING_STEPS.findIndex(
    s => s.id === data.currentStep
  )

  // Calculate progress
  const progress: OnboardingProgress = {
    currentStepIndex,
    totalSteps: ONBOARDING_STEPS.length,
    percentComplete: Math.round(
      (data.completedSteps.length / ONBOARDING_STEPS.length) * 100
    ),
    canProceed: true,
    canGoBack: currentStepIndex > 0,
  }

  // Go to next step
  const nextStep = useCallback(async () => {
    const currentIndex = ONBOARDING_STEPS.findIndex(s => s.id === data.currentStep)
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      const nextStepId = ONBOARDING_STEPS[currentIndex + 1].id

      // Mark current step as completed
      const completedSteps = data.completedSteps.includes(data.currentStep)
        ? data.completedSteps
        : [...data.completedSteps, data.currentStep]

      await saveData({
        ...data,
        currentStep: nextStepId,
        completedSteps,
      })
    }
  }, [data])

  // Go to previous step
  const previousStep = useCallback(async () => {
    const currentIndex = ONBOARDING_STEPS.findIndex(s => s.id === data.currentStep)
    if (currentIndex > 0) {
      const prevStepId = ONBOARDING_STEPS[currentIndex - 1].id
      await saveData({
        ...data,
        currentStep: prevStepId,
      })
    }
  }, [data])

  // Go to specific step
  const goToStep = useCallback(async (step: OnboardingStep) => {
    await saveData({
      ...data,
      currentStep: step,
    })
  }, [data])

  // Update business info
  const updateBusinessInfo = useCallback(async (businessInfo: BusinessInfo) => {
    await saveData({
      ...data,
      businessInfo,
    })
  }, [data])

  // Update WhatsApp setup
  const updateWhatsAppSetup = useCallback(async (whatsappSetup: WhatsAppSetupInfo) => {
    await saveData({
      ...data,
      whatsappSetup,
    })
  }, [data])

  // Add team invitation
  const addTeamInvitation = useCallback(async (invitation: TeamInvitation) => {
    // Check for duplicate
    if (data.teamInvitations.some(i => i.email === invitation.email)) {
      toast.error('This email has already been invited')
      return
    }

    await saveData({
      ...data,
      teamInvitations: [...data.teamInvitations, invitation],
    })
    toast.success('Invitation added')
  }, [data])

  // Remove team invitation
  const removeTeamInvitation = useCallback(async (email: string) => {
    await saveData({
      ...data,
      teamInvitations: data.teamInvitations.filter(i => i.email !== email),
    })
    toast.success('Invitation removed')
  }, [data])

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      toast.success('Onboarding complete!')
      router.push('/inbox')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      toast.error('Failed to complete onboarding')
    } finally {
      setIsSaving(false)
    }
  }, [router])

  // Validate current step
  const validateStep = useCallback((): StepValidation => {
    const stepErrors: Record<string, string> = {}

    switch (data.currentStep) {
      case 'business-info':
        if (!data.businessInfo?.businessName) {
          stepErrors.businessName = 'Business name is required'
        }
        if (!data.businessInfo?.industry) {
          stepErrors.industry = 'Industry is required'
        }
        if (!data.businessInfo?.teamSize) {
          stepErrors.teamSize = 'Team size is required'
        }
        break
      default:
        break
    }

    setErrors(stepErrors)
    return {
      isValid: Object.keys(stepErrors).length === 0,
      errors: stepErrors,
    }
  }, [data])

  // Skip current step (for optional steps)
  const skipStep = useCallback(async () => {
    const currentStep = ONBOARDING_STEPS.find(s => s.id === data.currentStep)
    if (currentStep?.isOptional) {
      await nextStep()
    }
  }, [data, nextStep])

  return {
    data,
    isLoading,
    isSaving,
    errors,
    progress,
    currentStep: data.currentStep,
    currentStepConfig: ONBOARDING_STEPS.find(s => s.id === data.currentStep),
    steps: ONBOARDING_STEPS,
    nextStep,
    previousStep,
    goToStep,
    skipStep,
    updateBusinessInfo,
    updateWhatsAppSetup,
    addTeamInvitation,
    removeTeamInvitation,
    completeOnboarding,
    validateStep,
  }
}
