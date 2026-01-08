/**
 * Help/Menu Intent Handler
 */

import { IntentHandler, BotResponse } from '../types'

export const helpHandler: IntentHandler = async (message, context) => {
  // Different menu based on mode
  const isIntegrated = message.mode === 'INTEGRATED'

  const menuText = `*Main Menu*\n\nPlease select an option:\n\n`

  const sections = []

  // Common options
  const commonRows = [
    { id: 'help_faq', title: 'FAQ', description: 'Frequently asked questions' },
    {
      id: 'help_contact',
      title: 'Contact Us',
      description: 'Get our contact details',
    },
    {
      id: 'help_human',
      title: 'Talk to Agent',
      description: 'Connect with our team',
    },
  ]

  if (isIntegrated) {
    // CA Firm specific options
    sections.push({
      title: 'Services',
      rows: [
        {
          id: 'service_itr',
          title: 'ITR Filing Status',
          description: 'Check your ITR filing status',
        },
        {
          id: 'service_gst',
          title: 'GST Filing Status',
          description: 'Check your GST returns',
        },
        {
          id: 'service_payment',
          title: 'Pay Dues',
          description: 'View and pay pending invoices',
        },
        {
          id: 'service_documents',
          title: 'Send Documents',
          description: 'Upload documents securely',
        },
      ],
    })
  }

  sections.push({
    title: 'Support',
    rows: commonRows,
  })

  const response: BotResponse = {
    messages: [
      {
        type: 'interactive',
        interactive: {
          type: 'list',
          body: menuText + 'Tap the button below to see all options.',
          footer: 'Available 24/7',
          buttonText: 'View Options',
          sections,
        },
      },
    ],
    contextUpdates: {
      lastIntents: [...context.lastIntents.slice(-9), 'help'],
    },
    actions: [],
    transferToHuman: false,
  }

  return response
}
