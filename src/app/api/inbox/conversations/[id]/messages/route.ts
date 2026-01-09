/**
 * Conversation Messages API Route
 * Get messages and send new messages in a conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  WhatsAppCloudApiService,
  normalizePhone,
} from '@repo/whatsapp-core'
import { dispatchMessageSent } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const before = searchParams.get('before') // Cursor for infinite scroll

    // Verify conversation belongs to organization
    const conversation = await prisma.whatsapp_conversations.findFirst({
      where: {
        id,
        organization_id: session.user.organizationId,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Build where clause
    const where: Record<string, unknown> = {
      conversation_id: id,
    }

    if (before) {
      where.created_at = { lt: new Date(before) }
    }

    // Get messages (oldest first for display)
    const messages = await prisma.whatsapp_messages.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
    })

    // Get total count for pagination info
    const total = await prisma.whatsapp_messages.count({
      where: { conversation_id: id },
    })

    return NextResponse.json({
      success: true,
      data: messages.reverse().map((m) => ({
        id: m.id,
        wamid: m.wamid,
        direction: m.direction,
        type: m.message_type || m.type,
        content: m.content,
        mediaId: m.media_id,
        mediaUrl: m.media_url,
        mediaMimeType: m.media_mime_type,
        mediaFilename: m.media_filename,
        templateName: m.template_name,
        interactiveType: m.interactive_type,
        interactiveResponse: m.interactive_response,
        replyToWamid: m.reply_to_wamid,
        status: m.status,
        errorCode: m.error_code,
        errorMessage: m.error_message,
        sentAt: m.sent_at,
        deliveredAt: m.delivered_at,
        readAt: m.read_at,
        createdAt: m.created_at,
      })),
      meta: {
        total,
        hasMore: messages.length === limit,
        oldestTimestamp: messages.length > 0 ? messages[0].created_at : null,
      },
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Get conversation with account and contact
    const conversation = await prisma.whatsapp_conversations.findFirst({
      where: {
        id,
        organization_id: session.user.organizationId,
      },
      include: {
        account: true,
        contact: true,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (!conversation.account) {
      return NextResponse.json({ error: 'WhatsApp account not configured' }, { status: 400 })
    }

    if (!conversation.contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 400 })
    }

    // Validate message type
    const validTypes = ['text', 'image', 'video', 'audio', 'document', 'template', 'interactive']
    if (!body.type || !validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid message type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Create WhatsApp API client
    const api = new WhatsAppCloudApiService({
      credentials: {
        phoneNumberId: conversation.account.phone_number_id,
        accessToken: conversation.account.access_token,
        wabaId: conversation.account.waba_id,
      },
    })

    const toPhone = normalizePhone(conversation.contact.phone_number)

    let waResponse: { messages: Array<{ id: string }> } | null = null
    let messageContent = ''

    try {
      // Send message based on type
      switch (body.type) {
        case 'text':
          if (!body.text) {
            return NextResponse.json({ error: 'Missing text content' }, { status: 400 })
          }
          waResponse = await api.sendText(toPhone, body.text)
          messageContent = body.text
          break

        case 'image':
          if (!body.mediaUrl && !body.mediaId) {
            return NextResponse.json({ error: 'Missing image URL or media ID' }, { status: 400 })
          }
          waResponse = body.mediaId
            ? await api.sendImageById(toPhone, body.mediaId, body.caption)
            : await api.sendImage(toPhone, body.mediaUrl, body.caption)
          messageContent = body.caption || '[Image]'
          break

        case 'document':
          if (!body.mediaUrl && !body.mediaId) {
            return NextResponse.json({ error: 'Missing document URL or media ID' }, { status: 400 })
          }
          // Document API uses URL-based sending
          waResponse = await api.sendDocument(toPhone, body.mediaUrl || body.mediaId, body.filename, body.caption)
          messageContent = body.filename || '[Document]'
          break

        case 'template':
          if (!body.templateName) {
            return NextResponse.json({ error: 'Missing template name' }, { status: 400 })
          }
          waResponse = await api.sendTemplate(
            toPhone,
            body.templateName,
            body.templateLanguage || 'en',
            body.templateComponents
          )
          messageContent = `[Template: ${body.templateName}]`
          break

        default:
          return NextResponse.json({ error: 'Unsupported message type for sending' }, { status: 400 })
      }
    } catch (apiError: unknown) {
      console.error('WhatsApp API error:', apiError)
      const errorMessage = apiError instanceof Error ? apiError.message : 'Failed to send message via WhatsApp'
      return NextResponse.json({ error: errorMessage }, { status: 502 })
    }

    if (!waResponse?.messages?.[0]?.id) {
      return NextResponse.json({ error: 'Failed to get message ID from WhatsApp' }, { status: 502 })
    }

    // Store message in database
    const message = await prisma.whatsapp_messages.create({
      data: {
        conversation_id: conversation.id,
        contact_id: conversation.contact_id,
        wamid: waResponse.messages[0].id,
        direction: 'OUTGOING',
        type: body.type.toUpperCase(),
        message_type: body.type.toUpperCase(),
        content: messageContent,
        media_url: body.mediaUrl || null,
        media_filename: body.filename || null,
        template_name: body.templateName || null,
        template_language: body.templateLanguage || null,
        status: 'SENT',
        sent_at: new Date(),
        sent_by_id: session.user.id,
      },
    })

    // Update conversation
    await prisma.whatsapp_conversations.update({
      where: { id: conversation.id },
      data: {
        last_message_at: new Date(),
        last_outbound_at: new Date(),
        last_message_preview: messageContent.substring(0, 100),
        message_count: { increment: 1 },
      },
    })

    // Update contact stats
    await prisma.whatsapp_contacts.update({
      where: { id: conversation.contact_id },
      data: {
        last_message_at: new Date(),
        last_outbound_at: new Date(),
        total_outbound_messages: { increment: 1 },
      },
    })

    // Dispatch webhook event
    await dispatchMessageSent(session.user.organizationId, {
      messageId: message.id,
      wamid: waResponse.messages[0].id,
      conversationId: conversation.id,
      contactId: conversation.contact_id,
      type: body.type,
      content: messageContent,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        wamid: message.wamid,
        direction: message.direction,
        type: message.message_type,
        content: message.content,
        status: message.status,
        sentAt: message.sent_at,
        createdAt: message.created_at,
      },
    })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
