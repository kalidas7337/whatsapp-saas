/**
 * Canned Responses Categories API
 *
 * GET /api/ai/canned-responses/categories - Get all categories with counts
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Default categories for new organizations
const DEFAULT_CATEGORIES = [
  { name: 'Greetings', description: 'Welcome and greeting messages' },
  { name: 'Pricing', description: 'Price quotes and pricing information' },
  { name: 'Support', description: 'Customer support responses' },
  { name: 'Sales', description: 'Sales and promotional messages' },
  { name: 'FAQ', description: 'Frequently asked questions' },
  { name: 'General', description: 'General purpose responses' },
  { name: 'FollowUp', description: 'Follow-up messages' },
  { name: 'Closing', description: 'Conversation closing messages' },
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { organizationId?: string }
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    // Get categories with counts from existing responses
    const categoryCounts = await prisma.whatsapp_canned_responses?.groupBy({
      by: ['category'],
      where: {
        organization_id: user.organizationId,
        is_active: true,
      },
      _count: {
        id: true,
      },
    }).catch(() => [])

    // Build category map from existing responses
    const categoryMap = new Map<string, number>()
    if (categoryCounts) {
      for (const cat of categoryCounts) {
        categoryMap.set(cat.category, cat._count.id)
      }
    }

    // Merge with default categories
    const categories = DEFAULT_CATEGORIES.map((cat) => ({
      name: cat.name,
      description: cat.description,
      count: categoryMap.get(cat.name) || 0,
    }))

    // Add any custom categories from responses that aren't in defaults
    for (const [name, count] of categoryMap) {
      if (!DEFAULT_CATEGORIES.find((d) => d.name === name)) {
        categories.push({
          name,
          description: 'Custom category',
          count,
        })
      }
    }

    // Sort by name
    categories.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Failed to get categories', message: (error as Error).message },
      { status: 500 }
    )
  }
}
