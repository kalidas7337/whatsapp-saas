/**
 * Templates API Route
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/v1/templates - List message templates
 *
 * Note: This endpoint is a placeholder - message templates are managed
 * via the WhatsApp Business Manager and synced through the WhatsApp Business API.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  validateAPIKey,
  requireScope,
  checkRateLimit,
  addRateLimitHeaders,
  logAPIRequest,
  errorResponse,
  paginatedResponse,
} from '@/lib/api'

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
  const scopeError = requireScope('templates:read')(context)
  if (scopeError) {
    await logAPIRequest(context, request, 403, Date.now() - startTime)
    return NextResponse.json(scopeError, { status: 403 })
  }

  try {
    // Templates are managed via WhatsApp Business Manager
    // This is a placeholder that returns an empty list
    // In a full implementation, this would sync templates from the WhatsApp Business API

    const response = NextResponse.json(
      paginatedResponse(
        [],
        1,
        50,
        0
      )
    )

    await logAPIRequest(context, request, 200, Date.now() - startTime)
    return addRateLimitHeaders(response, rateLimit.info)
  } catch (error) {
    console.error('Templates API error:', error)
    await logAPIRequest(context, request, 500, Date.now() - startTime)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to fetch templates'),
      { status: 500 }
    )
  }
}
