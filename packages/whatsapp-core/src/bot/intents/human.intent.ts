/**
 * Human Handoff Intent Handler
 */

import { IntentHandler, BotResponse } from '../types'

export const humanHandler: IntentHandler = async (message, context) => {
  const response: BotResponse = {
    messages: [
      {
        type: 'text',
        text: `I'll connect you with our team right away!\n\nA team member will respond shortly. Our typical response time is within 15 minutes during business hours (9 AM - 6 PM IST).\n\nFeel free to share your query, and we'll get back to you as soon as possible.`,
      },
    ],
    contextUpdates: {
      lastIntents: [...context.lastIntents.slice(-9), 'human'],
      currentFlowId: undefined, // Clear any active flow
      currentNodeId: undefined,
    },
    actions: [
      {
        type: 'send_notification',
        payload: {
          type: 'human_requested',
          conversationId: message.conversationId,
          contactId: message.contactId,
          contactName: message.contact.name,
          contactPhone: message.contact.phone,
        },
      },
    ],
    transferToHuman: true,
    transferReason: 'User requested human agent',
  }

  return response
}
