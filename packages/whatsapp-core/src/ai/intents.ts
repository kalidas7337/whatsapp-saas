import { Intent, IntentCategory, IntentDefinition, Priority, Sentiment } from './types'

/**
 * Intent Definitions
 */
export const INTENT_DEFINITIONS: Record<Intent, IntentDefinition> = {
  // Support intents
  general_inquiry: {
    category: 'support',
    description: 'General questions about the business',
    keywords: ['question', 'ask', 'know', 'information', 'tell me', 'what is', 'how does'],
    defaultPriority: 'medium',
  },
  product_inquiry: {
    category: 'support',
    description: 'Questions about products or services',
    keywords: ['product', 'service', 'feature', 'specification', 'details', 'available', 'offer'],
    defaultPriority: 'medium',
    autoRoute: 'sales',
  },
  pricing_inquiry: {
    category: 'support',
    description: 'Questions about pricing',
    keywords: ['price', 'cost', 'rate', 'fee', 'charge', 'discount', 'offer', 'deal'],
    defaultPriority: 'medium',
    autoRoute: 'sales',
  },
  order_status: {
    category: 'support',
    description: 'Checking order or delivery status',
    keywords: ['order', 'delivery', 'tracking', 'shipped', 'status', 'where is', 'when will'],
    defaultPriority: 'medium',
    triggerBot: 'order_tracking',
  },
  complaint: {
    category: 'support',
    description: 'Customer complaints or issues',
    keywords: ['problem', 'issue', 'complaint', 'wrong', 'bad', 'terrible', 'disappointed', 'unhappy', 'frustrated'],
    defaultPriority: 'high',
    autoRoute: 'support',
  },
  feedback: {
    category: 'support',
    description: 'Customer feedback or reviews',
    keywords: ['feedback', 'review', 'suggestion', 'improve', 'opinion', 'recommend'],
    defaultPriority: 'low',
  },
  technical_support: {
    category: 'support',
    description: 'Technical issues or bugs',
    keywords: ['bug', 'error', 'not working', 'crash', 'technical', 'help', 'broken', 'fix'],
    defaultPriority: 'high',
    autoRoute: 'technical',
  },

  // Sales intents
  purchase_intent: {
    category: 'sales',
    description: 'Customer wants to buy',
    keywords: ['buy', 'purchase', 'order', 'want', 'get', 'interested', 'looking for'],
    defaultPriority: 'high',
    autoRoute: 'sales',
  },
  quote_request: {
    category: 'sales',
    description: 'Request for quotation',
    keywords: ['quote', 'quotation', 'estimate', 'proposal', 'pricing', 'cost estimate'],
    defaultPriority: 'high',
    autoRoute: 'sales',
  },
  negotiation: {
    category: 'sales',
    description: 'Price negotiation',
    keywords: ['negotiate', 'discount', 'offer', 'deal', 'lower price', 'best price', 'cheaper'],
    defaultPriority: 'medium',
    autoRoute: 'sales',
  },
  follow_up: {
    category: 'sales',
    description: 'Sales follow-up',
    keywords: ['following up', 'checking in', 'update', 'status', 'any news', 'progress'],
    defaultPriority: 'medium',
  },

  // Administrative intents
  appointment_booking: {
    category: 'administrative',
    description: 'Schedule appointment or meeting',
    keywords: ['appointment', 'schedule', 'book', 'meeting', 'slot', 'available', 'calendar'],
    defaultPriority: 'medium',
    triggerBot: 'appointment_booking',
  },
  document_request: {
    category: 'administrative',
    description: 'Request for documents',
    keywords: ['document', 'invoice', 'receipt', 'certificate', 'statement', 'bill', 'copy'],
    defaultPriority: 'medium',
  },
  account_update: {
    category: 'administrative',
    description: 'Update account information',
    keywords: ['update', 'change', 'modify', 'account', 'profile', 'address', 'phone', 'email'],
    defaultPriority: 'low',
  },
  cancellation: {
    category: 'administrative',
    description: 'Cancel service or order',
    keywords: ['cancel', 'terminate', 'stop', 'end', 'unsubscribe', 'refund', 'return'],
    defaultPriority: 'high',
  },

  // Other intents
  greeting: {
    category: 'other',
    description: 'Greeting message',
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon', 'namaste'],
    defaultPriority: 'low',
    triggerBot: 'welcome',
  },
  gratitude: {
    category: 'other',
    description: 'Thank you message',
    keywords: ['thank', 'thanks', 'appreciate', 'grateful', 'awesome', 'great'],
    defaultPriority: 'low',
  },
  spam: {
    category: 'other',
    description: 'Spam or irrelevant message',
    keywords: [],
    defaultPriority: 'low',
  },
  unknown: {
    category: 'other',
    description: 'Cannot classify',
    keywords: [],
    defaultPriority: 'medium',
  },
}

/**
 * Get intent definition
 */
export function getIntentDefinition(intent: Intent): IntentDefinition {
  return INTENT_DEFINITIONS[intent] || INTENT_DEFINITIONS.unknown
}

/**
 * Get all intents by category
 */
export function getIntentsByCategory(category: IntentCategory): Intent[] {
  return Object.entries(INTENT_DEFINITIONS)
    .filter(([, def]) => def.category === category)
    .map(([intent]) => intent as Intent)
}

/**
 * Get all intent categories
 */
export function getAllCategories(): IntentCategory[] {
  return ['support', 'sales', 'administrative', 'other']
}

/**
 * Get priority based on intent and sentiment
 */
export function calculatePriority(
  intent: Intent,
  sentiment: Sentiment,
  confidence: number
): Priority {
  const basePriority = getIntentDefinition(intent).defaultPriority

  // Escalate if negative sentiment
  if (sentiment === 'negative') {
    if (basePriority === 'low') return 'medium'
    if (basePriority === 'medium') return 'high'
    if (basePriority === 'high') return 'urgent'
  }

  // Lower priority if low confidence
  if (confidence < 0.5) {
    return 'medium' // Always medium if unsure
  }

  return basePriority
}

/**
 * Get intents that should trigger auto-routing
 */
export function getAutoRouteIntents(): { intent: Intent; team: string }[] {
  return Object.entries(INTENT_DEFINITIONS)
    .filter(([, def]) => def.autoRoute)
    .map(([intent, def]) => ({
      intent: intent as Intent,
      team: def.autoRoute!,
    }))
}

/**
 * Get intents that should trigger bot flows
 */
export function getBotTriggerIntents(): { intent: Intent; flowId: string }[] {
  return Object.entries(INTENT_DEFINITIONS)
    .filter(([, def]) => def.triggerBot)
    .map(([intent, def]) => ({
      intent: intent as Intent,
      flowId: def.triggerBot!,
    }))
}

/**
 * Get intent description for display
 */
export function getIntentLabel(intent: Intent): string {
  const labels: Record<Intent, string> = {
    general_inquiry: 'General Inquiry',
    product_inquiry: 'Product Inquiry',
    pricing_inquiry: 'Pricing Inquiry',
    order_status: 'Order Status',
    complaint: 'Complaint',
    feedback: 'Feedback',
    technical_support: 'Technical Support',
    purchase_intent: 'Purchase Intent',
    quote_request: 'Quote Request',
    negotiation: 'Negotiation',
    follow_up: 'Follow Up',
    appointment_booking: 'Appointment Booking',
    document_request: 'Document Request',
    account_update: 'Account Update',
    cancellation: 'Cancellation',
    greeting: 'Greeting',
    gratitude: 'Thank You',
    spam: 'Spam',
    unknown: 'Unknown',
  }
  return labels[intent] || 'Unknown'
}
