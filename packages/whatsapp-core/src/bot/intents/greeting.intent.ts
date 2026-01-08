/**
 * Greeting Intent Handler
 */

import { IntentHandler, BotResponse } from '../types'

export const greetingHandler: IntentHandler = async (message, context) => {
  const name = message.contact.name || 'there'
  const hour = new Date().getHours()

  let greeting: string
  if (hour < 12) {
    greeting = 'Good morning'
  } else if (hour < 17) {
    greeting = 'Good afternoon'
  } else {
    greeting = 'Good evening'
  }

  const response: BotResponse = {
    messages: [
      {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: `${greeting}, ${name}! \n\nWelcome! How can I help you today?`,
          buttons: [
            { id: 'menu_help', title: 'Main Menu' },
            { id: 'menu_status', title: 'Check Status' },
            { id: 'menu_human', title: 'Talk to Agent' },
          ],
        },
      },
    ],
    contextUpdates: {
      lastIntents: [...context.lastIntents.slice(-9), 'greeting'],
    },
    actions: [],
    transferToHuman: false,
  }

  return response
}
