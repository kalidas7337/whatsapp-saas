'use client'

import { useOnboarding } from '@/hooks/onboarding/use-onboarding'
import { ProgressIndicator } from './progress-indicator'
import { WelcomeStep } from './steps/welcome-step'
import { BusinessInfoStep } from './steps/business-info-step'
import { WhatsAppSetupStep } from './steps/whatsapp-setup-step'
import { InviteTeamStep } from './steps/invite-team-step'
import { CompleteStep } from './steps/complete-step'
import { Loader2 } from 'lucide-react'

export function OnboardingWizard() {
  const {
    data,
    isLoading,
    isSaving,
    currentStep,
    steps,
    nextStep,
    previousStep,
    skipStep,
    updateBusinessInfo,
    updateWhatsAppSetup,
    addTeamInvitation,
    removeTeamInvitation,
    completeOnboarding,
  } = useOnboarding()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={nextStep} />

      case 'business-info':
        return (
          <BusinessInfoStep
            initialData={data.businessInfo}
            onNext={async (businessInfo) => {
              await updateBusinessInfo(businessInfo)
              await nextStep()
            }}
            onBack={previousStep}
            isSaving={isSaving}
          />
        )

      case 'whatsapp-setup':
        return (
          <WhatsAppSetupStep
            initialData={data.whatsappSetup}
            onNext={async (whatsappSetup) => {
              await updateWhatsAppSetup(whatsappSetup)
              await nextStep()
            }}
            onBack={previousStep}
            onSkip={skipStep}
            isSaving={isSaving}
          />
        )

      case 'invite-team':
        return (
          <InviteTeamStep
            invitations={data.teamInvitations}
            onAddInvitation={addTeamInvitation}
            onRemoveInvitation={removeTeamInvitation}
            onNext={nextStep}
            onBack={previousStep}
            onSkip={skipStep}
            isSaving={isSaving}
          />
        )

      case 'complete':
        return (
          <CompleteStep
            data={data}
            onComplete={completeOnboarding}
            isCompleting={isSaving}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Indicator - hide on welcome and complete steps */}
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="mb-12 px-4">
          <ProgressIndicator
            steps={steps}
            currentStep={currentStep}
            completedSteps={data.completedSteps}
          />
        </div>
      )}

      {/* Step Content */}
      <div className="px-4">{renderStep()}</div>
    </div>
  )
}
