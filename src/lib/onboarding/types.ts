// Onboarding step identifiers
export type OnboardingStep =
  | 'welcome'
  | 'business-info'
  | 'whatsapp-setup'
  | 'invite-team'
  | 'complete'

// Step configuration
export interface StepConfig {
  id: OnboardingStep
  title: string
  description: string
  isOptional?: boolean
}

// Business information
export interface BusinessInfo {
  businessName: string
  industry: string
  teamSize: string
  useCases: string[]
  timezone?: string
  website?: string
}

// WhatsApp Business Account setup
export interface WhatsAppSetupInfo {
  connectionMethod: 'existing' | 'new' | 'skip'
  wabaId?: string
  phoneNumberId?: string
  businessPhoneNumber?: string
  displayName?: string
  verificationStatus?: 'pending' | 'verified' | 'failed'
}

// Team invitation
export interface TeamInvitation {
  email: string
  role: 'admin' | 'agent' | 'viewer'
  name?: string
}

// Complete onboarding data
export interface OnboardingData {
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  businessInfo: BusinessInfo | null
  whatsappSetup: WhatsAppSetupInfo | null
  teamInvitations: TeamInvitation[]
  startedAt: Date
  completedAt?: Date
}

// Step validation result
export interface StepValidation {
  isValid: boolean
  errors: Record<string, string>
}

// Onboarding progress
export interface OnboardingProgress {
  currentStepIndex: number
  totalSteps: number
  percentComplete: number
  canProceed: boolean
  canGoBack: boolean
}

// Industry options
export const INDUSTRY_OPTIONS = [
  { value: 'ecommerce', label: 'E-commerce & Retail' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'travel', label: 'Travel & Hospitality' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'food-delivery', label: 'Food & Delivery' },
  { value: 'saas', label: 'SaaS & Technology' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'professional-services', label: 'Professional Services' },
  { value: 'other', label: 'Other' },
] as const

// Team size options
export const TEAM_SIZE_OPTIONS = [
  { value: '1', label: 'Just me' },
  { value: '2-5', label: '2-5 people' },
  { value: '6-10', label: '6-10 people' },
  { value: '11-25', label: '11-25 people' },
  { value: '26-50', label: '26-50 people' },
  { value: '50+', label: '50+ people' },
] as const

// Use case options
export const USE_CASE_OPTIONS = [
  { value: 'customer-support', label: 'Customer Support', icon: 'headphones' },
  { value: 'sales', label: 'Sales & Lead Generation', icon: 'trending-up' },
  { value: 'marketing', label: 'Marketing & Promotions', icon: 'megaphone' },
  { value: 'notifications', label: 'Notifications & Alerts', icon: 'bell' },
  { value: 'appointments', label: 'Appointment Booking', icon: 'calendar' },
  { value: 'order-updates', label: 'Order Updates', icon: 'package' },
  { value: 'feedback', label: 'Feedback Collection', icon: 'message-square' },
  { value: 'automation', label: 'Workflow Automation', icon: 'zap' },
] as const

// Step order configuration
export const ONBOARDING_STEPS: StepConfig[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Get started with WhatsApp Business',
  },
  {
    id: 'business-info',
    title: 'Business Info',
    description: 'Tell us about your business',
  },
  {
    id: 'whatsapp-setup',
    title: 'WhatsApp Setup',
    description: 'Connect your WhatsApp Business Account',
  },
  {
    id: 'invite-team',
    title: 'Invite Team',
    description: 'Add your team members',
    isOptional: true,
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'You\'re all set!',
  },
]

// Role options for team invitations
export const TEAM_ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to all features and settings'
  },
  {
    value: 'agent',
    label: 'Agent',
    description: 'Handle conversations and customer support'
  },
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'View-only access to analytics and reports'
  },
] as const

// API response types
export interface OnboardingResponse {
  success: boolean
  data?: OnboardingData
  error?: string
}

export interface SaveStepResponse {
  success: boolean
  nextStep?: OnboardingStep
  error?: string
}

export interface CompleteOnboardingResponse {
  success: boolean
  redirectUrl?: string
  error?: string
}
