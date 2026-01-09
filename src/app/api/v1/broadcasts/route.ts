/**
 * Broadcasts API Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/v1/broadcasts - List broadcasts/campaigns
 * POST /api/v1/broadcasts - Create a broadcast campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  validateAPIKey,
  requireScope,
  checkRateLimit,
  addRateLimitHeaders,
  logAPIRequest,
  successResponse,
  errorResponse,
  paginatedResponse,
} from '@/lib/api'
import { dispatchCampaignStarted } from '@/lib/api'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Validate API key
  const authResult = await validateAPIKey(request)
  if (!authResult.context) {
    return NextResponse.json(
      authResult.error || errorResponse('UNAUTHORIZED', 'Invalid API key'),
      { status: 401 }
    )
  }

  const context = authResult.context

  // Check rate limit
  const rateLimit = checkRateLimit(context.apiKeyId)
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      errorResponse('RATE_LIMITED', 'Rate limit exceeded'),
      { status: 429 }
    )
    return addRateLimitHeaders(response, rateLimit.info)
  }

  // Check scope
  const scopeError = requireScope('broadcasts:read')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const status = searchParams.get('status')

    // Build query
    const where: Record<string, unknown> = {
      organization_id: context.organizationId,
    }

    if (status) where.status = status.toUpperCase()

    // Get total count
    const total = await prisma.whatsapp_broadcasts.count({ where })

    // Get broadcasts
    const broadcasts = await prisma.whatsapp_broadcasts.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const response = NextResponse.json(
      paginatedResponse(
        broadcasts.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          templateName: b.template_name,
          templateLanguage: b.template_language,
          audienceType: b.audience_type,
          totalRecipients: b.total_recipients,
          sentCount: b.sent_count,
          deliveredCount: b.delivered_count,
          readCount: b.read_count,
          failedCount: b.failed_count,
          status: b.status,
          scheduledAt: b.scheduled_at,
          startedAt: b.started_at,
          completedAt: b.completed_at,
          createdAt: b.created_at,
        })),
        page,
        limit,
        total
      )
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Broadcasts API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to fetch broadcasts'),
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  // Validate API key
  const authResult = await validateAPIKey(request)
  if (!authResult.context) {
    return NextResponse.json(
      authResult.error || errorResponse('UNAUTHORIZED', 'Invalid API key'),
      { status: 401 }
    )
  }

  const context = authResult.context

  // Check rate limit
  const rateLimit = checkRateLimit(context.apiKeyId)
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      errorResponse('RATE_LIMITED', 'Rate limit exceeded'),
      { status: 429 }
    )
    return addRateLimitHeaders(response, rateLimit.info)
  }

  // Check scope
  const scopeError = requireScope('broadcasts:write')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Missing required field: name'),
        { status: 400 }
      )
    }

    if (!body.templateName) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Missing required field: templateName'),
        { status: 400 }
      )
    }

    // Get the organization's WhatsApp account
    const account = await prisma.whatsapp_accounts.findFirst({
      where: {
        organization_id: context.organizationId,
        is_active: true,
      },
    })

    if (!account) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'No active WhatsApp account found. Please connect your WhatsApp Business Account first.'),
        { status: 404 }
      )
    }

    // Get recipient count based on audience type
    let totalRecipients = 0
    let contactIds: string[] = []

    if (body.audienceType === 'contacts' && body.contactIds) {
      // Specific contacts
      contactIds = body.contactIds
      totalRecipients = contactIds.length
    } else if (body.audienceType === 'all') {
      // All opted-in contacts
      const contacts = await prisma.whatsapp_contacts.findMany({
        where: {
          whatsapp_account_id: account.id,
          opted_in: true,
          is_blocked: false,
        },
        select: { id: true },
      })
      contactIds = contacts.map((c) => c.id)
      totalRecipients = contacts.length
    } else if (body.audienceType === 'segment' && body.audienceFilter) {
      // Filtered segment - apply filters
      const contacts = await prisma.whatsapp_contacts.findMany({
        where: {
          whatsapp_account_id: account.id,
          opted_in: true,
          is_blocked: false,
          // Apply filters from audienceFilter
          ...(body.audienceFilter.hasClient !== undefined && {
            client_id: body.audienceFilter.hasClient ? { not: null } : null,
          }),
        },
        select: { id: true },
      })
      contactIds = contacts.map((c) => c.id)
      totalRecipients = contacts.length
    }

    if (totalRecipients === 0) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'No recipients found for this broadcast. Ensure contacts have opted in.'),
        { status: 400 }
      )
    }

    // Create broadcast
    const broadcast = await prisma.whatsapp_broadcasts.create({
      data: {
        organization_id: context.organizationId,
        whatsapp_account_id: account.id,
        name: body.name,
        description: body.description || null,
        template_name: body.templateName,
        template_language: body.templateLanguage || 'en',
        template_components: body.templateComponents || null,
        audience_type: body.audienceType || 'all',
        audience_filter: body.audienceFilter || null,
        contact_list: contactIds,
        total_recipients: totalRecipients,
        status: body.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduled_at: body.scheduledAt ? new Date(body.scheduledAt) : null,
        created_by: context.apiKeyId,
      },
    })

    // If immediate send requested (not scheduled), start processing
    if (body.sendImmediately && !body.scheduledAt) {
      // Update status to PROCESSING
      await prisma.whatsapp_broadcasts.update({
        where: { id: broadcast.id },
        data: {
          status: 'PROCESSING',
          started_at: new Date(),
        },
      })

      // Create recipient records
      const contacts = await prisma.whatsapp_contacts.findMany({
        where: { id: { in: contactIds } },
        select: { id: true, phone_number: true },
      })

      await prisma.broadcast_recipients.createMany({
        data: contacts.map((c) => ({
          broadcast_id: broadcast.id,
          contact_id: c.id,
          phone_number: c.phone_number,
          status: 'PENDING',
        })),
      })

      // Dispatch webhook event
      await dispatchCampaignStarted(context.organizationId, {
        broadcastId: broadcast.id,
        name: broadcast.name,
        totalRecipients,
        timestamp: new Date().toISOString(),
      })

      // Queue for processing (in production, this would be a job queue)
      // For now, we'll process in the background
      processBroadcast(broadcast.id, account).catch(console.error)
    }

    const response = NextResponse.json(
      successResponse({
        id: broadcast.id,
        name: broadcast.name,
        templateName: broadcast.template_name,
        totalRecipients,
        status: broadcast.status,
        scheduledAt: broadcast.scheduled_at,
        createdAt: broadcast.created_at,
      }),
      { status: 201 }
    )

    await logAPIRequest(context, request, 201, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Broadcasts API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to create broadcast'),
      { status: 500 }
    )
  }
}

/**
 * Process broadcast - sends messages to recipients
 * In production, this should be a separate worker/job queue
 */
async function processBroadcast(
  broadcastId: string,
  account: {
    phone_number_id: string
    access_token: string
    waba_id: string
  }
) {
  const { WhatsAppCloudApiService } = await import('@repo/whatsapp-core')

  try {
    const broadcast = await prisma.whatsapp_broadcasts.findUnique({
      where: { id: broadcastId },
      include: { recipients: { where: { status: 'PENDING' } } },
    })

    if (!broadcast) return

    const api = new WhatsAppCloudApiService({
      credentials: {
        phoneNumberId: account.phone_number_id,
        accessToken: account.access_token,
        wabaId: account.waba_id,
      },
    })

    let sentCount = 0
    let failedCount = 0

    // Process recipients in batches to avoid rate limits
    const batchSize = 10
    const recipients = broadcast.recipients

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (recipient) => {
          try {
            const result = await api.sendTemplate(
              recipient.phone_number,
              broadcast.template_name,
              broadcast.template_language,
              (broadcast.template_components as unknown) as import('@repo/whatsapp-core').TemplateComponentPayload[] | undefined
            )

            await prisma.broadcast_recipients.update({
              where: { id: recipient.id },
              data: {
                status: 'SENT',
                wamid: result.messages?.[0]?.id,
                sent_at: new Date(),
              },
            })

            sentCount++
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            await prisma.broadcast_recipients.update({
              where: { id: recipient.id },
              data: {
                status: 'FAILED',
                error_message: errorMessage,
              },
            })

            failedCount++
          }
        })
      )

      // Update broadcast progress
      await prisma.whatsapp_broadcasts.update({
        where: { id: broadcastId },
        data: {
          sent_count: sentCount,
          failed_count: failedCount,
        },
      })

      // Rate limit: wait 1 second between batches
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // Mark broadcast as completed
    await prisma.whatsapp_broadcasts.update({
      where: { id: broadcastId },
      data: {
        status: failedCount === recipients.length ? 'FAILED' : 'COMPLETED',
        completed_at: new Date(),
      },
    })

    // Dispatch completion webhook
    const { dispatchCampaignCompleted, dispatchCampaignFailed } = await import('@/lib/api')

    if (failedCount === recipients.length) {
      await dispatchCampaignFailed(broadcast.organization_id, {
        broadcastId,
        name: broadcast.name,
        failedCount,
        timestamp: new Date().toISOString(),
      })
    } else {
      await dispatchCampaignCompleted(broadcast.organization_id, {
        broadcastId,
        name: broadcast.name,
        sentCount,
        failedCount,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Broadcast processing error:', error)

    await prisma.whatsapp_broadcasts.update({
      where: { id: broadcastId },
      data: {
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : 'Processing failed',
        completed_at: new Date(),
      },
    })
  }
}
