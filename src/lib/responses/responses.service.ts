/**
 * Canned Responses Service
 *
 * Business logic for managing canned responses
 */

import { prisma } from '@/lib/prisma'
import {
  CannedResponse,
  CreateResponseInput,
  UpdateResponseInput,
  ResponseSearchParams,
  ResponseCategory,
  ResolvedResponse,
  ResponseVariable,
} from './types'
import {
  resolveVariables,
  extractVariables,
  VariableContext,
  validateShortcut,
} from './variables'

/**
 * Canned Responses Service
 */
export class ResponsesService {
  private organizationId: string
  private userId: string

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId
    this.userId = userId
  }

  /**
   * Get all responses with optional filtering
   */
  async getResponses(params: ResponseSearchParams = {}): Promise<CannedResponse[]> {
    const { query, category, tags, limit = 50, offset = 0 } = params

    const where: Record<string, unknown> = {
      organization_id: this.organizationId,
    }

    if (category) {
      where.category = category
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { shortcut: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags }
    }

    const responses = await prisma.whatsapp_canned_responses.findMany({
      where,
      orderBy: [{ usage_count: 'desc' }, { title: 'asc' }],
      take: limit,
      skip: offset,
    })

    return responses.map((r) => this.mapToResponse(r))
  }

  /**
   * Get response by ID
   */
  async getResponse(id: string): Promise<CannedResponse | null> {
    const response = await prisma.whatsapp_canned_responses.findFirst({
      where: {
        id,
        organization_id: this.organizationId,
      },
    })

    return response ? this.mapToResponse(response) : null
  }

  /**
   * Get response by shortcut
   */
  async getByShortcut(shortcut: string): Promise<CannedResponse | null> {
    const response = await prisma.whatsapp_canned_responses.findFirst({
      where: {
        organization_id: this.organizationId,
        shortcut,
        is_active: true,
      },
    })

    return response ? this.mapToResponse(response) : null
  }

  /**
   * Search responses by shortcut prefix
   */
  async searchByShortcut(prefix: string): Promise<CannedResponse[]> {
    const responses = await prisma.whatsapp_canned_responses.findMany({
      where: {
        organization_id: this.organizationId,
        shortcut: { startsWith: prefix },
        is_active: true,
      },
      orderBy: { usage_count: 'desc' },
      take: 10,
    })

    return responses.map((r) => this.mapToResponse(r))
  }

  /**
   * Create new response
   */
  async createResponse(input: CreateResponseInput): Promise<CannedResponse> {
    // Validate shortcut if provided
    if (input.shortcut) {
      const validation = validateShortcut(input.shortcut)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Check for duplicate shortcut
      const existing = await this.getByShortcut(input.shortcut)
      if (existing) {
        throw new Error('Shortcut already exists')
      }
    }

    // Extract variables from content
    const extractedVars = extractVariables(input.content)
    const variables: ResponseVariable[] =
      input.variables ||
      extractedVars.map((v) => ({ name: v, type: 'custom' as const }))

    const response = await prisma.whatsapp_canned_responses.create({
      data: {
        organization_id: this.organizationId,
        title: input.title,
        content: input.content,
        category: input.category,
        shortcut: input.shortcut || null,
        tags: input.tags || [],
        matching_intents: [],
        matching_sentiments: [],
        created_by: this.userId,
        is_active: true,
        usage_count: 0,
        success_rate: 0,
      },
    })

    // Return with extracted variables
    const mapped = this.mapToResponse(response)
    mapped.variables = variables
    return mapped
  }

  /**
   * Update response
   */
  async updateResponse(
    id: string,
    input: UpdateResponseInput
  ): Promise<CannedResponse> {
    // Check ownership
    const existing = await this.getResponse(id)
    if (!existing) {
      throw new Error('Response not found')
    }

    // Validate shortcut if being updated
    if (input.shortcut && input.shortcut !== existing.shortcut) {
      const validation = validateShortcut(input.shortcut)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Check for duplicate (excluding current)
      const duplicate = await prisma.whatsapp_canned_responses.findFirst({
        where: {
          organization_id: this.organizationId,
          shortcut: input.shortcut,
          id: { not: id },
        },
      })

      if (duplicate) {
        throw new Error('Shortcut already exists')
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    }

    if (input.title !== undefined) updateData.title = input.title
    if (input.content !== undefined) updateData.content = input.content
    if (input.category !== undefined) updateData.category = input.category
    if (input.shortcut !== undefined) updateData.shortcut = input.shortcut
    if (input.tags !== undefined) updateData.tags = input.tags
    if (input.isActive !== undefined) updateData.is_active = input.isActive

    const response = await prisma.whatsapp_canned_responses.update({
      where: { id },
      data: updateData,
    })

    return this.mapToResponse(response)
  }

  /**
   * Delete response
   */
  async deleteResponse(id: string): Promise<void> {
    // Check ownership
    const existing = await this.getResponse(id)
    if (!existing) {
      throw new Error('Response not found')
    }

    await prisma.whatsapp_canned_responses.delete({
      where: { id },
    })
  }

  /**
   * Increment usage count
   */
  async recordUsage(id: string): Promise<void> {
    await prisma.whatsapp_canned_responses.update({
      where: { id },
      data: {
        usage_count: { increment: 1 },
        last_used_at: new Date(),
      },
    })
  }

  /**
   * Get categories with counts
   */
  async getCategories(): Promise<ResponseCategory[]> {
    const groups = await prisma.whatsapp_canned_responses.groupBy({
      by: ['category'],
      where: { organization_id: this.organizationId },
      _count: { category: true },
    })

    const categoryConfig: Record<string, { color: string; icon: string }> = {
      greetings: { color: 'green', icon: '👋' },
      pricing: { color: 'blue', icon: '💰' },
      support: { color: 'orange', icon: '🛠️' },
      sales: { color: 'purple', icon: '🛒' },
      general: { color: 'gray', icon: '📝' },
      faq: { color: 'cyan', icon: '❓' },
      followup: { color: 'indigo', icon: '📞' },
      closing: { color: 'pink', icon: '👋' },
    }

    return groups.map((g) => {
      const config = categoryConfig[g.category.toLowerCase()] || {
        color: 'gray',
        icon: '📁',
      }
      return {
        id: g.category,
        name: g.category,
        color: config.color,
        icon: config.icon,
        responseCount: g._count.category,
      }
    })
  }

  /**
   * Resolve response with context
   */
  async resolveResponse(
    id: string,
    context: VariableContext
  ): Promise<ResolvedResponse> {
    const response = await this.getResponse(id)

    if (!response) {
      throw new Error('Response not found')
    }

    const { resolved, unresolved } = resolveVariables(response.content, context)

    return {
      original: response,
      resolvedContent: resolved,
      unresolvedVariables: unresolved,
    }
  }

  /**
   * Get most used responses
   */
  async getMostUsed(limit = 10): Promise<CannedResponse[]> {
    const responses = await prisma.whatsapp_canned_responses.findMany({
      where: {
        organization_id: this.organizationId,
        is_active: true,
      },
      orderBy: { usage_count: 'desc' },
      take: limit,
    })

    return responses.map((r) => this.mapToResponse(r))
  }

  /**
   * Get recent responses
   */
  async getRecent(limit = 10): Promise<CannedResponse[]> {
    const responses = await prisma.whatsapp_canned_responses.findMany({
      where: {
        organization_id: this.organizationId,
        is_active: true,
        last_used_at: { not: null },
      },
      orderBy: { last_used_at: 'desc' },
      take: limit,
    })

    return responses.map((r) => this.mapToResponse(r))
  }

  /**
   * Duplicate a response
   */
  async duplicateResponse(id: string): Promise<CannedResponse> {
    const original = await this.getResponse(id)
    if (!original) {
      throw new Error('Response not found')
    }

    return this.createResponse({
      title: `${original.title} (Copy)`,
      content: original.content,
      category: original.category,
      tags: original.tags,
    })
  }

  /**
   * Map database record to response type
   */
  private mapToResponse(record: {
    id: string
    organization_id: string
    title: string
    content: string
    category: string
    shortcut: string | null
    tags: string[]
    is_active: boolean
    usage_count: number
    success_rate: number
    created_by: string
    created_at: Date
    updated_at: Date
  }): CannedResponse {
    // Extract variables from content
    const extractedVars = extractVariables(record.content)

    return {
      id: record.id,
      organizationId: record.organization_id,
      title: record.title,
      content: record.content,
      category: record.category,
      shortcut: record.shortcut,
      variables: extractedVars.map((v) => ({ name: v, type: 'custom' as const })),
      attachments: [],
      tags: record.tags || [],
      isActive: record.is_active,
      usageCount: record.usage_count,
      successRate: record.success_rate,
      createdBy: record.created_by,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }
  }
}
