/**
 * WhatsApp Webhook Route
 *
 * Receives webhooks from Meta WhatsApp Cloud API
 * - GET: Webhook verification (hub.challenge)
 * - POST: Incoming messages and status updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyWebhookSignature,
  type WebhookPayload,
  type WebhookMessage,
  type WebhookStatus,
  type ParsedIncomingMessage,
  type ParsedStatusUpdate,
  normalizePhone,
} from '@repo/whatsapp-core'
import {
  dispatchMessageReceived,
  dispatchMessageDelivered,
  dispatchMessageRead,
  dispatchMessageFailed,
  dispatchConversationCreated,
} from '@/lib/api'

const META_APP_SECRET = process.env.META_APP_SECRET || ''

/**
 * GET - Webhook verification
 * Meta sends a challenge to verify the webhook URL
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('[WHATSAPP WEBHOOK] Verification request:', { mode, token: token?.substring(0, 8) + '...' })

  if (mode === 'subscribe') {
    // Find the account with this verify token
    const account = await prisma.whatsapp_accounts.findFirst({
      where: {
        webhook_verify_token: token,
        is_active: true,
      },
    })

    if (account) {
      console.log('[WHATSAPP WEBHOOK] Verification successful for account:', account.display_name)
      return new NextResponse(challenge, { status: 200 })
    }

    // Fallback: Check environment variable for a global verify token
    const globalVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
    if (globalVerifyToken && token === globalVerifyToken) {
      console.log('[WHATSAPP WEBHOOK] Verification successful with global token')
      return new NextResponse(challenge, { status: 200 })
    }

    console.log('[WHATSAPP WEBHOOK] Verification failed - token mismatch')
    return new NextResponse('Forbidden', { status: 403 })
  }

  return new NextResponse('Bad Request', { status: 400 })
}

/**
 * POST - Receive webhooks
 * Process incoming messages and status updates from Meta
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get raw body for signature verification
    const rawBody = await request.text()

    // Verify signature
    const signature = request.headers.get('x-hub-signature-256')
    if (!verifyWebhookSignature(rawBody, signature, META_APP_SECRET)) {
      console.warn('[WHATSAPP WEBHOOK] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse payload
    const payload: WebhookPayload = JSON.parse(rawBody)

    // Validate payload structure
    if (payload.object !== 'whatsapp_business_account') {
      console.warn('[WHATSAPP WEBHOOK] Invalid object type:', payload.object)
      return NextResponse.json({ error: 'Invalid object type' }, { status: 400 })
    }

    // Process each entry
    for (const entry of payload.entry) {
      const wabaId = entry.id

      for (const change of entry.changes) {
        if (change.field !== 'messages') continue

        const value = change.value
        const phoneNumberId = value.metadata.phone_number_id

        // Find the WhatsApp account
        const account = await prisma.whatsapp_accounts.findFirst({
          where: {
            phone_number_id: phoneNumberId,
            is_active: true,
          },
        })

        if (!account) {
          console.warn('[WHATSAPP WEBHOOK] Account not found for phone_number_id:', phoneNumberId)
          continue
        }

        // Process messages
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            await processIncomingMessage(account, value.contacts?.[0], message)
          }
        }

        // Process status updates
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            await processStatusUpdate(account, status)
          }
        }
      }
    }

    const processingTime = Date.now() - startTime
    console.log('[WHATSAPP WEBHOOK] Processed in', processingTime, 'ms')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[WHATSAPP WEBHOOK] Error processing webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Process incoming message
 */
async function processIncomingMessage(
  account: {
    id: string
    organization_id: string
    ca_firm_id: string
    phone_number_id: string
  },
  contactInfo: { wa_id: string; profile: { name: string } } | undefined,
  message: WebhookMessage
): Promise<void> {
  const fromPhone = normalizePhone(message.from)
  const contactName = contactInfo?.profile?.name || message.from

  console.log('[WHATSAPP WEBHOOK] Processing message from:', fromPhone, 'type:', message.type)

  try {
    // Find or create contact
    let contact = await prisma.whatsapp_contacts.findFirst({
      where: {
        whatsapp_account_id: account.id,
        phone_number: fromPhone,
      },
    })

    if (!contact) {
      contact = await prisma.whatsapp_contacts.create({
        data: {
          whatsapp_account_id: account.id,
          organization_id: account.organization_id,
          phone_number: fromPhone,
          wa_id: contactInfo?.wa_id || message.from,
          name: contactName,
          profile_name: contactName,
          last_message_at: new Date(),
          last_inbound_at: new Date(),
          total_inbound_messages: 1,
        },
      })
    } else {
      // Update contact
      await prisma.whatsapp_contacts.update({
        where: { id: contact.id },
        data: {
          profile_name: contactName,
          last_message_at: new Date(),
          last_inbound_at: new Date(),
          total_inbound_messages: { increment: 1 },
        },
      })
    }

    // Find or create conversation
    let conversation = await prisma.whatsapp_conversations.findFirst({
      where: {
        whatsapp_account_id: account.id,
        contact_id: contact.id,
        status: { in: ['OPEN', 'PENDING'] },
      },
    })

    const isNewConversation = !conversation

    if (!conversation) {
      conversation = await prisma.whatsapp_conversations.create({
        data: {
          whatsapp_account_id: account.id,
          contact_id: contact.id,
          organization_id: account.organization_id,
          status: 'OPEN',
          last_message_at: new Date(),
          last_inbound_at: new Date(),
          message_count: 1,
          unread_count: 1,
          // 24-hour window from Meta
          window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
    } else {
      // Update conversation
      await prisma.whatsapp_conversations.update({
        where: { id: conversation.id },
        data: {
          status: 'OPEN',
          last_message_at: new Date(),
          last_inbound_at: new Date(),
          last_message_preview: extractMessagePreview(message),
          message_count: { increment: 1 },
          unread_count: { increment: 1 },
          // Refresh 24-hour window
          window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
    }

    // Parse message content
    const parsedMessage = parseIncomingMessage(message, account, contactName)

    // Store message
    const storedMessage = await prisma.whatsapp_messages.create({
      data: {
        conversation_id: conversation.id,
        contact_id: contact.id,
        wamid: message.id,
        direction: 'INCOMING',
        type: mapMessageType(message.type),
        message_type: mapMessageType(message.type),
        content: parsedMessage.text || parsedMessage.caption || null,
        media_id: parsedMessage.mediaId || null,
        media_mime_type: parsedMessage.mimeType || null,
        media_filename: parsedMessage.filename || null,
        interactive_type: message.interactive?.type || null,
        interactive_response: message.interactive ? JSON.parse(JSON.stringify(message.interactive)) : null,
        button_payload: message.button?.payload || null,
        reply_to_wamid: message.context?.id || null,
        status: 'DELIVERED',
        metadata: {
          messageType: message.type,
          hasMedia: !!parsedMessage.mediaId,
          hasReply: !!message.context?.id,
        },
      },
    })

    // Dispatch webhook event
    await dispatchMessageReceived(account.organization_id, {
      message_id: storedMessage.id,
      conversation_id: conversation.id,
      contact_id: contact.id,
      from: fromPhone,
      from_name: contactName,
      type: message.type,
      content: parsedMessage.text || parsedMessage.caption,
      timestamp: new Date().toISOString(),
    })

    // Dispatch conversation created event if new
    if (isNewConversation) {
      await dispatchConversationCreated(account.organization_id, {
        conversation_id: conversation.id,
        contact_id: contact.id,
        contact_phone: fromPhone,
        contact_name: contactName,
        timestamp: new Date().toISOString(),
      })
    }

    console.log('[WHATSAPP WEBHOOK] Message stored:', storedMessage.id)
  } catch (error) {
    console.error('[WHATSAPP WEBHOOK] Error storing message:', error)
    throw error
  }
}

/**
 * Process status update
 */
async function processStatusUpdate(
  account: {
    id: string
    organization_id: string
  },
  status: WebhookStatus
): Promise<void> {
  console.log('[WHATSAPP WEBHOOK] Processing status update:', status.status, 'for message:', status.id)

  try {
    // Find the message by wamid
    const message = await prisma.whatsapp_messages.findFirst({
      where: { wamid: status.id },
      include: { conversation: true },
    })

    if (!message) {
      console.warn('[WHATSAPP WEBHOOK] Message not found for wamid:', status.id)
      return
    }

    // Update message status
    const updateData: Record<string, unknown> = {
      status: mapStatus(status.status),
      status_timestamp: new Date(parseInt(status.timestamp) * 1000),
    }

    switch (status.status) {
      case 'sent':
        updateData.sent_at = new Date(parseInt(status.timestamp) * 1000)
        break
      case 'delivered':
        updateData.delivered_at = new Date(parseInt(status.timestamp) * 1000)
        break
      case 'read':
        updateData.read_at = new Date(parseInt(status.timestamp) * 1000)
        break
      case 'failed':
        updateData.failed_at = new Date(parseInt(status.timestamp) * 1000)
        updateData.error_code = status.errors?.[0]?.code?.toString()
        updateData.error_message = status.errors?.[0]?.message || status.errors?.[0]?.title
        break
    }

    await prisma.whatsapp_messages.update({
      where: { id: message.id },
      data: updateData,
    })

    // Dispatch webhook events based on status
    const eventData = {
      message_id: message.id,
      conversation_id: message.conversation_id,
      wamid: status.id,
      status: status.status,
      timestamp: new Date().toISOString(),
    }

    switch (status.status) {
      case 'delivered':
        await dispatchMessageDelivered(account.organization_id, eventData)
        break
      case 'read':
        await dispatchMessageRead(account.organization_id, eventData)
        break
      case 'failed':
        await dispatchMessageFailed(account.organization_id, {
          ...eventData,
          error: status.errors?.[0],
        })
        break
    }

    console.log('[WHATSAPP WEBHOOK] Status updated for message:', message.id)
  } catch (error) {
    console.error('[WHATSAPP WEBHOOK] Error updating status:', error)
  }
}

/**
 * Parse incoming message to extract content
 */
function parseIncomingMessage(
  message: WebhookMessage,
  account: { phone_number_id: string },
  contactName: string
): ParsedIncomingMessage {
  const parsed: ParsedIncomingMessage = {
    messageId: message.id,
    from: message.from,
    fromName: contactName,
    timestamp: new Date(parseInt(message.timestamp) * 1000),
    type: message.type,
    phoneNumberId: account.phone_number_id,
    wabaId: '',
    raw: message,
  }

  // Extract content based on message type
  switch (message.type) {
    case 'text':
      parsed.text = message.text?.body
      break
    case 'image':
    case 'video':
    case 'audio':
    case 'sticker':
      const media = message[message.type]
      if (media) {
        parsed.mediaId = media.id
        parsed.mimeType = media.mime_type
        parsed.caption = media.caption
      }
      break
    case 'document':
      if (message.document) {
        parsed.mediaId = message.document.id
        parsed.mimeType = message.document.mime_type
        parsed.caption = message.document.caption
        parsed.filename = message.document.filename
      }
      break
    case 'location':
      if (message.location) {
        parsed.location = {
          latitude: message.location.latitude,
          longitude: message.location.longitude,
          name: message.location.name,
          address: message.location.address,
        }
      }
      break
    case 'contacts':
      parsed.contacts = message.contacts
      break
    case 'interactive':
      if (message.interactive) {
        parsed.interactiveReply = {
          type: message.interactive.type === 'button_reply' ? 'button' : 'list',
          id: message.interactive.button_reply?.id || message.interactive.list_reply?.id || '',
          title: message.interactive.button_reply?.title || message.interactive.list_reply?.title || '',
          description: message.interactive.list_reply?.description,
        }
      }
      break
    case 'button':
      if (message.button) {
        parsed.text = message.button.text
      }
      break
    case 'reaction':
      if (message.reaction) {
        parsed.reaction = {
          messageId: message.reaction.message_id,
          emoji: message.reaction.emoji,
          isRemoved: message.reaction.emoji === '',
        }
      }
      break
  }

  // Add reply context
  if (message.context?.id) {
    parsed.replyToMessageId = message.context.id
  }

  // Add referral
  if (message.referral) {
    parsed.referral = message.referral
  }

  return parsed
}

/**
 * Extract message preview for conversation list
 */
function extractMessagePreview(message: WebhookMessage): string {
  switch (message.type) {
    case 'text':
      return message.text?.body?.substring(0, 100) || ''
    case 'image':
      return message.image?.caption || '📷 Image'
    case 'video':
      return message.video?.caption || '🎥 Video'
    case 'audio':
      return '🎵 Audio'
    case 'document':
      return message.document?.filename || '📄 Document'
    case 'sticker':
      return '🏷️ Sticker'
    case 'location':
      return `📍 ${message.location?.name || 'Location'}`
    case 'contacts':
      return '👤 Contact'
    case 'interactive':
      return message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || 'Interactive'
    case 'button':
      return message.button?.text || 'Button'
    case 'reaction':
      return message.reaction?.emoji || '❤️ Reaction'
    default:
      return 'Message'
  }
}

/**
 * Map Meta message type to our enum
 */
function mapMessageType(type: string): 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'STICKER' | 'LOCATION' | 'CONTACTS' | 'INTERACTIVE' | 'BUTTON' | 'TEMPLATE' | 'REACTION' | 'ORDER' | 'SYSTEM' | 'UNKNOWN' {
  const typeMap: Record<string, 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'STICKER' | 'LOCATION' | 'CONTACTS' | 'INTERACTIVE' | 'BUTTON' | 'TEMPLATE' | 'REACTION' | 'ORDER' | 'SYSTEM' | 'UNKNOWN'> = {
    text: 'TEXT',
    image: 'IMAGE',
    video: 'VIDEO',
    audio: 'AUDIO',
    document: 'DOCUMENT',
    sticker: 'STICKER',
    location: 'LOCATION',
    contacts: 'CONTACTS',
    interactive: 'INTERACTIVE',
    button: 'BUTTON',
    template: 'TEMPLATE',
    reaction: 'REACTION',
    order: 'ORDER',
    system: 'SYSTEM',
  }
  return typeMap[type] || 'UNKNOWN'
}

/**
 * Map Meta status to our enum
 */
function mapStatus(status: string): 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' {
  const statusMap: Record<string, 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
    sent: 'SENT',
    delivered: 'DELIVERED',
    read: 'READ',
    failed: 'FAILED',
  }
  return statusMap[status] || 'PENDING'
}
