/**
 * Status Inquiry Intent Handler
 *
 * Mode-aware: Different responses for standalone vs integrated
 */

import { IntentHandler, BotResponse } from '../types'

export const statusHandler: IntentHandler = async (message, context) => {
  // Different response based on mode
  if (message.mode === 'INTEGRATED' && message.pmsClientId) {
    // Integrated mode: Show option to fetch real status
    return {
      messages: [
        {
          type: 'interactive',
          interactive: {
            type: 'button',
            body: `I can check your filing status. What would you like to know?\n\nSelect an option below:`,
            buttons: [
              { id: 'status_itr', title: 'ITR Status' },
              { id: 'status_gst', title: 'GST Status' },
              { id: 'status_all', title: 'All Filings' },
            ],
          },
        },
      ],
      contextUpdates: {
        lastIntents: [...context.lastIntents.slice(-9), 'status'],
        variables: {
          ...context.variables,
          awaitingStatusType: true,
        },
      },
      actions: [],
      transferToHuman: false,
    }
  }

  // Standalone mode: Generic response
  return {
    messages: [
      {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: `To check your status, please contact our team.\n\nWould you like to speak with someone?`,
          buttons: [
            { id: 'human_yes', title: 'Yes, Connect Me' },
            { id: 'menu_help', title: 'Back to Menu' },
          ],
        },
      },
    ],
    contextUpdates: {
      lastIntents: [...context.lastIntents.slice(-9), 'status'],
    },
    actions: [],
    transferToHuman: false,
  }
}
