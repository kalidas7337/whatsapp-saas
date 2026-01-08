/**
 * API Keys Management Route (Internal)
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/settings/api-keys - List API keys
 * POST /api/settings/api-keys - Create an API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAPIKeyService } from '@/lib/api'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = createAPIKeyService(
      session.user.organizationId,
      session.user.id
    )
    const keys = await service.listKeys()

    return NextResponse.json({
      success: true,
      data: keys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        scopes: k.scopes,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        isActive: k.isActive,
        createdAt: k.createdAt,
      })),
    })
  } catch (error) {
    console.error('API keys list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    if (!body.scopes || !Array.isArray(body.scopes) || body.scopes.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty scopes array' },
        { status: 400 }
      )
    }

    const service = createAPIKeyService(
      session.user.organizationId,
      session.user.id
    )
    const key = await service.createKey({
      name: body.name,
      scopes: body.scopes,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        secret: key.secret, // Only returned on creation
        scopes: key.scopes,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
      },
    })
  } catch (error) {
    console.error('API key creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}
