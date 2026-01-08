/**
 * Fallback Intent Handler
 *
 * Handles unknown messages and repeated failures
 */

import { IntentHandler, BotResponse } from '../types'

export const fallbackHandler: IntentHandler = async (message, context) => {
  // Check if user has been stuck (multiple unknown intents)
  const recentUnknowns = context.lastIntents.filter(
    (i) => i === 'unknown'
  ).length

  if (recentUnknowns >= 2) {
    // Offer human assistance after repeated failures
    return {
      messages: [
        {
          type: 'interactive',
          interactive: {
            type: 'button',
            body: `I'm having trouble understanding your request.\n\nWould you like to:\n- See our menu options\n- Connect with our team`,
            buttons: [
              { id: 'menu_help', title: 'Show Menu' },
              { id: 'menu_human', title: 'Talk to Agent' },
            ],
          },
        },
      ],
      contextUpdates: {
        lastIntents: [...context.lastIntents.slice(-9), 'unknown'],
      },
      actions: [],
      transferToHuman: false,
    }
  }

  return {
    messages: [
      {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: `I'm not sure I understood that.\n\nCould you try rephrasing, or select from these options:`,
          buttons: [
            { id: 'menu_help', title: 'Main Menu' },
            { id: 'menu_status', title: 'Check Status' },
            { id: 'menu_human', title: 'Talk to Agent' },
          ],
        },
      },
    ],
    contextUpdates: {
      lastIntents: [...context.lastIntents.slice(-9), 'unknown'],
    },
    actions: [],
    transferToHuman: false,
  }
}
