/**
 * Single Conversation API Route
 * Get/Update a specific conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const conversation = await prisma.whatsapp_conversations.findFirst({
      where: {
        id,
        organization_id: session.user.organizationId,
      },
      include: {
        contact: {
          select: {
            id: true,
            phone_number: true,
            name: true,
            profile_name: true,
            client_id: true,
            is_blocked: true,
            opted_in: true,
            total_inbound_messages: true,
            total_outbound_messages: true,
            created_at: true,
          },
        },
        account: {
          select: {
            id: true,
            display_name: true,
            phone_number: true,
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Mark as read when viewing
    if (conversation.unread_count > 0) {
      await prisma.whatsapp_conversations.update({
        where: { id },
        data: { unread_count: 0 },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        contact: conversation.contact
          ? {
              id: conversation.contact.id,
              phoneNumber: conversation.contact.phone_number,
              name: conversation.contact.name || conversation.contact.profile_name,
              clientId: conversation.contact.client_id,
              isBlocked: conversation.contact.is_blocked,
              optedIn: conversation.contact.opted_in,
              totalInbound: conversation.contact.total_inbound_messages,
              totalOutbound: conversation.contact.total_outbound_messages,
              createdAt: conversation.contact.created_at,
            }
          : null,
        account: conversation.account
          ? {
              id: conversation.account.id,
              displayName: conversation.account.display_name,
              phoneNumber: conversation.account.phone_number,
            }
          : null,
        status: conversation.status,
        assignedTo: conversation.assigned_to,
        unreadCount: 0, // We just marked as read
        messageCount: conversation.message_count,
        lastMessageAt: conversation.last_message_at,
        windowExpiresAt: conversation.window_expires_at,
        windowOpen: conversation.window_expires_at ? new Date(conversation.window_expires_at) > new Date() : false,
        botMode: conversation.bot_mode,
        tags: conversation.tags,
        metadata: conversation.metadata,
        createdAt: conversation.created_at,
      },
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (body.status) {
      updateData.status = body.status.toUpperCase()
    }

    if (body.assignedTo !== undefined) {
      updateData.assigned_to = body.assignedTo
    }

    if (body.tags) {
      updateData.tags = body.tags
    }

    if (body.botMode) {
      updateData.bot_mode = body.botMode
      updateData.is_bot_active = body.botMode !== 'HUMAN'
    }

    const updated = await prisma.whatsapp_conversations.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        assignedTo: updated.assigned_to,
        tags: updated.tags,
        botMode: updated.bot_mode,
      },
    })
  } catch (error) {
    console.error('Update conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}
