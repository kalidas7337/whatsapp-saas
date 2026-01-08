/**
 * Single API Key Management Route (Internal)
 * PROMPT 32: External Webhooks & Public API System
 *
 * GET /api/settings/api-keys/:id - Get API key details
 * PATCH /api/settings/api-keys/:id - Update API key
 * DELETE /api/settings/api-keys/:id - Revoke API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAPIKeyService } from '@/lib/api'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = createAPIKeyService(
      session.user.organizationId,
      session.user.id
    )
    const key = await service.getKey(id)

    if (!key) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Get stats and logs
    const [stats, logs] = await Promise.all([
      service.getKeyStats(id),
      service.getKeyLogs(id, 20),
    ])

    return NextResponse.json({
      success: true,
      data: {
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        scopes: key.scopes,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        isActive: key.isActive,
        createdAt: key.createdAt,
        stats,
        recentLogs: logs,
      },
    })
  } catch (error) {
    console.error('API key fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const service = createAPIKeyService(
      session.user.organizationId,
      session.user.id
    )

    const existing = await service.getKey(id)
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    const key = await service.updateKey(id, {
      name: body.name,
      scopes: body.scopes,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        scopes: key.scopes,
        isActive: key.isActive,
      },
    })
  } catch (error) {
    console.error('API key update error:', error)
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = createAPIKeyService(
      session.user.organizationId,
      session.user.id
    )

    const existing = await service.getKey(id)
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    await service.revokeKey(id)

    return NextResponse.json({
      success: true,
      data: { revoked: true, id },
    })
  } catch (error) {
    console.error('API key revoke error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}
