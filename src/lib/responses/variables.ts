/**
 * Response Variable System
 *
 * Handles variable definitions and resolution for canned responses
 */

import { ResponseVariable } from './types'

/**
 * System Variables - Available in all responses
 */
export const SYSTEM_VARIABLES: ResponseVariable[] = [
  // Contact variables
  {
    name: 'contact_name',
    type: 'contact',
    description: "Contact's full name",
  },
  {
    name: 'contact_first_name',
    type: 'contact',
    description: "Contact's first name",
  },
  {
    name: 'contact_phone',
    type: 'contact',
    description: "Contact's phone number",
  },
  {
    name: 'contact_email',
    type: 'contact',
    description: "Contact's email address",
  },

  // Conversation variables
  {
    name: 'conversation_id',
    type: 'conversation',
    description: 'Conversation reference ID',
  },
  {
    name: 'last_message',
    type: 'conversation',
    description: 'Last message in conversation',
  },

  // Agent variables
  {
    name: 'agent_name',
    type: 'text',
    description: "Current agent's name",
  },
  {
    name: 'agent_email',
    type: 'text',
    description: "Current agent's email",
  },

  // Business variables
  {
    name: 'business_name',
    type: 'text',
    description: 'Business/organization name',
  },
  {
    name: 'business_phone',
    type: 'text',
    description: 'Business phone number',
  },
  {
    name: 'business_email',
    type: 'text',
    description: 'Business email',
  },
  {
    name: 'business_website',
    type: 'text',
    description: 'Business website URL',
  },

  // Date/Time variables
  {
    name: 'current_date',
    type: 'text',
    description: 'Current date',
  },
  {
    name: 'current_time',
    type: 'text',
    description: 'Current time',
  },
  {
    name: 'current_day',
    type: 'text',
    description: 'Current day of week',
  },
]

/**
 * Variable context for resolution
 */
export interface VariableContext {
  contact?: {
    name?: string
    firstName?: string
    phone?: string
    email?: string
  }
  conversation?: {
    id?: string
    lastMessage?: string
    metadata?: Record<string, unknown>
  }
  agent?: {
    name?: string
    email?: string
  }
  organization?: {
    name?: string
    phone?: string
    email?: string
    website?: string
  }
  custom?: Record<string, string>
}

/**
 * Resolve variables in content
 */
export function resolveVariables(
  content: string,
  context: VariableContext
): { resolved: string; unresolved: string[] } {
  const unresolved: string[] = []

  const resolved = content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = getVariableValue(varName, context)

    if (value === undefined) {
      unresolved.push(varName)
      return match // Keep original if not resolved
    }

    return value
  })

  return { resolved, unresolved }
}

/**
 * Get variable value from context
 */
function getVariableValue(
  name: string,
  context: VariableContext
): string | undefined {
  // Contact variables
  if (name === 'contact_name') return context.contact?.name
  if (name === 'contact_first_name')
    return context.contact?.firstName || context.contact?.name?.split(' ')[0]
  if (name === 'contact_phone') return context.contact?.phone
  if (name === 'contact_email') return context.contact?.email

  // Conversation variables
  if (name === 'conversation_id') return context.conversation?.id
  if (name === 'last_message') return context.conversation?.lastMessage

  // Agent variables
  if (name === 'agent_name') return context.agent?.name
  if (name === 'agent_email') return context.agent?.email

  // Business variables
  if (name === 'business_name') return context.organization?.name
  if (name === 'business_phone') return context.organization?.phone
  if (name === 'business_email') return context.organization?.email
  if (name === 'business_website') return context.organization?.website

  // Date/Time variables
  if (name === 'current_date') return new Date().toLocaleDateString()
  if (name === 'current_time') return new Date().toLocaleTimeString()
  if (name === 'current_day')
    return new Date().toLocaleDateString('en-US', { weekday: 'long' })

  // Custom variables
  if (context.custom?.[name]) return context.custom[name]

  // Check conversation metadata
  if (context.conversation?.metadata?.[name]) {
    return String(context.conversation.metadata[name])
  }

  return undefined
}

/**
 * Extract variables from content
 */
export function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
}

/**
 * Validate shortcut format
 */
export function validateShortcut(shortcut: string): {
  valid: boolean
  error?: string
} {
  if (!shortcut.startsWith('/')) {
    return { valid: false, error: 'Shortcut must start with /' }
  }

  if (shortcut.length < 2) {
    return { valid: false, error: 'Shortcut must be at least 2 characters' }
  }

  if (shortcut.length > 20) {
    return { valid: false, error: 'Shortcut must be less than 20 characters' }
  }

  if (!/^\/[a-z0-9_]+$/.test(shortcut)) {
    return {
      valid: false,
      error: 'Shortcut can only contain lowercase letters, numbers, and underscores',
    }
  }

  return { valid: true }
}

/**
 * Preview resolved content with sample data
 */
export function previewWithSampleData(content: string): string {
  const sampleContext: VariableContext = {
    contact: {
      name: 'John Doe',
      firstName: 'John',
      phone: '+1234567890',
      email: 'john@example.com',
    },
    conversation: {
      id: 'CONV-12345',
      lastMessage: 'Previous message text...',
    },
    agent: {
      name: 'Support Agent',
      email: 'support@company.com',
    },
    organization: {
      name: 'Acme Inc.',
      phone: '+1800123456',
      email: 'hello@acme.com',
      website: 'https://acme.com',
    },
  }

  const { resolved } = resolveVariables(content, sampleContext)
  return resolved
}

/**
 * Get variable description
 */
export function getVariableDescription(varName: string): string | undefined {
  const systemVar = SYSTEM_VARIABLES.find((v) => v.name === varName)
  return systemVar?.description
}

/**
 * Check if a variable is a system variable
 */
export function isSystemVariable(varName: string): boolean {
  return SYSTEM_VARIABLES.some((v) => v.name === varName)
}
