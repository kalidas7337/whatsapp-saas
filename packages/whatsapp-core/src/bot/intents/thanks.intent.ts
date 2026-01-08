/**
 * Thanks/Bye Intent Handler
 */

import { IntentHandler, BotResponse } from '../types'

export const thanksHandler: IntentHandler = async (message, context) => {
  const responses = [
    "You're welcome! Is there anything else I can help you with?",
    'Happy to help! Let me know if you need anything else.',
    'My pleasure! Feel free to reach out anytime.',
  ]

  const randomResponse = responses[Math.floor(Math.random() * responses.length)]

  return {
    messages: [
      {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: randomResponse,
          buttons: [
            { id: 'menu_help', title: 'Main Menu' },
            { id: 'menu_human', title: 'Talk to Agent' },
          ],
        },
      },
    ],
    contextUpdates: {
      lastIntents: [...context.lastIntents.slice(-9), 'thanks'],
    },
    actions: [],
    transferToHuman: false,
  }
}

export const byeHandler: IntentHandler = async (message, context) => {
  const name = message.contact.name || 'there'

  return {
    messages: [
      {
        type: 'text',
        text: `Goodbye, ${name}! Have a great day!\n\nFeel free to message us anytime if you need assistance.`,
      },
    ],
    contextUpdates: {
      lastIntents: [...context.lastIntents.slice(-9), 'bye'],
      // Clear flow on goodbye
      currentFlowId: undefined,
      currentNodeId: undefined,
    },
    actions: [],
    transferToHuman: false,
  }
}
