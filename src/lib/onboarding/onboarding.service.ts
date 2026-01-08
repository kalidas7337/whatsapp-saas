import { prisma } from '../prisma'
import {
  OnboardingData,
  OnboardingStep,
  BusinessInfo,
  WhatsAppSetupInfo,
  TeamInvitation,
  StepValidation,
  OnboardingProgress,
  ONBOARDING_STEPS,
} from './types'

// Default onboarding data
const createDefaultOnboardingData = (): OnboardingData => ({
  currentStep: 'welcome',
  completedSteps: [],
  businessInfo: null,
  whatsappSetup: null,
  teamInvitations: [],
  startedAt: new Date(),
})

export class OnboardingService {
  // Get or create onboarding data for an organization
  async getOnboardingData(organizationId: string): Promise<OnboardingData> {
    const firm = await prisma.ca_firms.findUnique({
      where: { id: organizationId },
      select: {
        onboarding_data: true,
        onboarding_completed: true,
      },
    })

    if (!firm) {
      throw new Error('Organization not found')
    }

    // If onboarding is complete, return completed state
    if (firm.onboarding_completed) {
      return {
        currentStep: 'complete',
        completedSteps: ['welcome', 'business-info', 'whatsapp-setup', 'invite-team', 'complete'],
        businessInfo: null,
        whatsappSetup: null,
        teamInvitations: [],
        startedAt: new Date(),
        completedAt: new Date(),
      }
    }

    // Parse existing onboarding data or create new
    if (firm.onboarding_data && typeof firm.onboarding_data === 'object') {
      return firm.onboarding_data as unknown as OnboardingData
    }

    return createDefaultOnboardingData()
  }

  // Save onboarding data
  async saveOnboardingData(
    organizationId: string,
    data: Partial<OnboardingData>
  ): Promise<OnboardingData> {
    const currentData = await this.getOnboardingData(organizationId)
    const updatedData = { ...currentData, ...data }

    await prisma.ca_firms.update({
      where: { id: organizationId },
      data: {
        onboarding_data: updatedData as object,
        updatedAt: new Date(),
      },
    })

    return updatedData
  }

  // Update current step
  async updateStep(
    organizationId: string,
    step: OnboardingStep
  ): Promise<OnboardingData> {
    const data = await this.getOnboardingData(organizationId)
    data.currentStep = step

    return this.saveOnboardingData(organizationId, data)
  }

  // Mark step as completed
  async completeStep(
    organizationId: string,
    step: OnboardingStep
  ): Promise<OnboardingData> {
    const data = await this.getOnboardingData(organizationId)

    if (!data.completedSteps.includes(step)) {
      data.completedSteps.push(step)
    }

    // Move to next step
    const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === step)
    if (stepIndex < ONBOARDING_STEPS.length - 1) {
      data.currentStep = ONBOARDING_STEPS[stepIndex + 1].id
    }

    return this.saveOnboardingData(organizationId, data)
  }

  // Save business info
  async saveBusinessInfo(
    organizationId: string,
    businessInfo: BusinessInfo
  ): Promise<OnboardingData> {
    // Update organization with business info
    await prisma.ca_firms.update({
      where: { id: organizationId },
      data: {
        firm_name: businessInfo.businessName,
        updatedAt: new Date(),
      },
    })

    const data = await this.getOnboardingData(organizationId)
    data.businessInfo = businessInfo

    return this.saveOnboardingData(organizationId, data)
  }

  // Save WhatsApp setup info
  async saveWhatsAppSetup(
    organizationId: string,
    whatsappSetup: WhatsAppSetupInfo
  ): Promise<OnboardingData> {
    const data = await this.getOnboardingData(organizationId)
    data.whatsappSetup = whatsappSetup

    // If connecting an existing WABA, store credentials
    if (whatsappSetup.connectionMethod === 'existing' && whatsappSetup.wabaId) {
      // Store WABA credentials in organization settings
      await prisma.ca_firms.update({
        where: { id: organizationId },
        data: {
          updatedAt: new Date(),
        },
      })
    }

    return this.saveOnboardingData(organizationId, data)
  }

  // Add team invitation
  async addTeamInvitation(
    organizationId: string,
    invitation: TeamInvitation
  ): Promise<OnboardingData> {
    const data = await this.getOnboardingData(organizationId)

    // Check for duplicate email
    if (data.teamInvitations.some(i => i.email === invitation.email)) {
      throw new Error('This email has already been invited')
    }

    data.teamInvitations.push(invitation)

    return this.saveOnboardingData(organizationId, data)
  }

  // Remove team invitation
  async removeTeamInvitation(
    organizationId: string,
    email: string
  ): Promise<OnboardingData> {
    const data = await this.getOnboardingData(organizationId)
    data.teamInvitations = data.teamInvitations.filter(i => i.email !== email)

    return this.saveOnboardingData(organizationId, data)
  }

  // Send team invitations
  async sendTeamInvitations(organizationId: string): Promise<void> {
    const data = await this.getOnboardingData(organizationId)

    // Get organization details
    const firm = await prisma.ca_firms.findUnique({
      where: { id: organizationId },
      select: { firm_name: true },
    })

    if (!firm) {
      throw new Error('Organization not found')
    }

    // Create pending invitations in database
    for (const invitation of data.teamInvitations) {
      // In a real implementation, you would:
      // 1. Create an invitation record in the database
      // 2. Send an email with an invitation link
      // 3. Track invitation status

      console.log(
        `Sending invitation to ${invitation.email} for ${firm.firm_name}`
      )
    }
  }

  // Complete onboarding
  async completeOnboarding(organizationId: string): Promise<void> {
    const data = await this.getOnboardingData(organizationId)
    data.currentStep = 'complete'
    data.completedAt = new Date()

    if (!data.completedSteps.includes('complete')) {
      data.completedSteps.push('complete')
    }

    // Send team invitations if any
    if (data.teamInvitations.length > 0) {
      await this.sendTeamInvitations(organizationId)
    }

    // Update organization
    await prisma.ca_firms.update({
      where: { id: organizationId },
      data: {
        onboarding_completed: true,
        onboarding_data: data as object,
        updatedAt: new Date(),
      },
    })
  }

  // Check if onboarding is complete
  async isOnboardingComplete(organizationId: string): Promise<boolean> {
    const firm = await prisma.ca_firms.findUnique({
      where: { id: organizationId },
      select: { onboarding_completed: true },
    })

    return firm?.onboarding_completed ?? false
  }

  // Validate step data
  validateStep(step: OnboardingStep, data: OnboardingData): StepValidation {
    const errors: Record<string, string> = {}

    switch (step) {
      case 'business-info':
        if (!data.businessInfo?.businessName) {
          errors.businessName = 'Business name is required'
        }
        if (!data.businessInfo?.industry) {
          errors.industry = 'Industry is required'
        }
        if (!data.businessInfo?.teamSize) {
          errors.teamSize = 'Team size is required'
        }
        break

      case 'whatsapp-setup':
        // WhatsApp setup can be skipped
        break

      case 'invite-team':
        // Team invitations are optional
        break

      default:
        break
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  // Get progress information
  getProgress(data: OnboardingData): OnboardingProgress {
    const currentStepIndex = ONBOARDING_STEPS.findIndex(
      s => s.id === data.currentStep
    )
    const totalSteps = ONBOARDING_STEPS.length

    return {
      currentStepIndex,
      totalSteps,
      percentComplete: Math.round(
        (data.completedSteps.length / totalSteps) * 100
      ),
      canProceed: true,
      canGoBack: currentStepIndex > 0,
    }
  }

  // Get next step
  getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
    const currentIndex = ONBOARDING_STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      return ONBOARDING_STEPS[currentIndex + 1].id
    }
    return null
  }

  // Get previous step
  getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
    const currentIndex = ONBOARDING_STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      return ONBOARDING_STEPS[currentIndex - 1].id
    }
    return null
  }
}

export const onboardingService = new OnboardingService()
