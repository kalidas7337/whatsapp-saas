/**
 * Inbox Conversations API Route
 * Dashboard API for listing and managing conversations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const assignedTo = searchParams.get('assignedTo')

    // Build where clause
    const where: Record<string, unknown> = {
      organization_id: session.user.organizationId,
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (assignedTo === 'me') {
      where.assigned_to = session.user.id
    } else if (assignedTo === 'unassigned') {
      where.assigned_to = null
    } else if (assignedTo && assignedTo !== 'all') {
      where.assigned_to = assignedTo
    }

    // Search by contact name or phone
    if (search) {
      where.contact = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone_number: { contains: search } },
          { profile_name: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    // Get total count
    const total = await prisma.whatsapp_conversations.count({ where })

    // Get conversations with contact info
    const conversations = await prisma.whatsapp_conversations.findMany({
      where,
      orderBy: [
        { unread_count: 'desc' },
        { last_message_at: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        contact: {
          select: {
            id: true,
            phone_number: true,
            name: true,
            profile_name: true,
            client_id: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: conversations.map((c) => ({
        id: c.id,
        contact: c.contact
          ? {
              id: c.contact.id,
              phoneNumber: c.contact.phone_number,
              name: c.contact.name || c.contact.profile_name,
              clientId: c.contact.client_id,
            }
          : null,
        status: c.status,
        assignedTo: c.assigned_to,
        unreadCount: c.unread_count,
        messageCount: c.message_count,
        lastMessageAt: c.last_message_at,
        lastMessagePreview: c.last_message_preview,
        windowExpiresAt: c.window_expires_at,
        botMode: c.bot_mode,
        tags: c.tags,
        createdAt: c.created_at,
      })),
      meta: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Inbox conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
