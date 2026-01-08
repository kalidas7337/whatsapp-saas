/**
 * Template Service
 *
 * Message template management operations
 */

import { WhatsAppCloudApiService } from './cloud-api.service'
import { TemplateInfo, TemplatesListResponse } from '../types/api.types'
import { TemplateComponentPayload, TemplateParameter } from '../types/message.types'
import { WhatsAppValidationError } from '../errors/whatsapp-error'

/**
 * Template parameter for sending
 */
export interface TemplateParam {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video'
  value: string | number | { code: string; amount: number; fallback: string }
}

/**
 * Template send options
 */
export interface TemplateSendOptions {
  headerParams?: TemplateParam[]
  bodyParams?: TemplateParam[]
  buttonParams?: Array<{
    subType: 'quick_reply' | 'url'
    index: number
    params: TemplateParam[]
  }>
}

/**
 * Cached template info
 */
export interface CachedTemplate {
  template: TemplateInfo
  cachedAt: number
}

/**
 * Template Service
 *
 * Manages message templates with caching and validation
 */
export class TemplateService {
  private templateCache: Map<string, CachedTemplate> = new Map()
  private readonly cacheTTL: number

  constructor(
    private readonly api: WhatsAppCloudApiService,
    options: { cacheTTL?: number } = {}
  ) {
    this.cacheTTL = options.cacheTTL || 5 * 60 * 1000 // 5 minutes default
  }

  /**
   * Get all templates
   */
  async getTemplates(options?: {
    limit?: number
    status?: string
    forceRefresh?: boolean
  }): Promise<TemplateInfo[]> {
    const response = await this.api.getMessageTemplates({
      limit: options?.limit,
      status: options?.status,
    })

    // Update cache
    for (const template of response.data) {
      const key = `${template.name}:${template.language}`
      this.templateCache.set(key, {
        template,
        cachedAt: Date.now(),
      })
    }

    return response.data
  }

  /**
   * Get all templates with pagination
   */
  async getAllTemplates(): Promise<TemplateInfo[]> {
    const templates: TemplateInfo[] = []
    let after: string | undefined

    while (true) {
      const response = await this.api.getMessageTemplates({
        limit: 100,
        after,
      })

      templates.push(...response.data)

      if (!response.paging?.next) {
        break
      }

      // Extract after cursor from next URL
      const nextUrl = new URL(response.paging.next)
      after = nextUrl.searchParams.get('after') || undefined
    }

    return templates
  }

  /**
   * Get a template by name
   */
  async getTemplate(
    name: string,
    language: string = 'en',
    options?: { forceRefresh?: boolean }
  ): Promise<TemplateInfo | null> {
    const cacheKey = `${name}:${language}`

    // Check cache
    if (!options?.forceRefresh) {
      const cached = this.templateCache.get(cacheKey)
      if (cached && Date.now() - cached.cachedAt < this.cacheTTL) {
        return cached.template
      }
    }

    // Fetch from API
    const templates = await this.getTemplates({ forceRefresh: true })
    const template = templates.find(
      (t) => t.name === name && t.language === language
    )

    return template || null
  }

  /**
   * Check if a template is approved and ready to use
   */
  async isTemplateApproved(name: string, language: string = 'en'): Promise<boolean> {
    const template = await this.getTemplate(name, language)
    return template?.status === 'APPROVED'
  }

  /**
   * Send a template message
   */
  async send(
    to: string,
    templateName: string,
    language: string = 'en',
    options?: TemplateSendOptions
  ) {
    // Build components
    const components: TemplateComponentPayload[] = []

    // Header parameters
    if (options?.headerParams?.length) {
      components.push({
        type: 'header',
        parameters: options.headerParams.map((p) => this.buildParameter(p)),
      })
    }

    // Body parameters
    if (options?.bodyParams?.length) {
      components.push({
        type: 'body',
        parameters: options.bodyParams.map((p) => this.buildParameter(p)),
      })
    }

    // Button parameters
    if (options?.buttonParams?.length) {
      for (const button of options.buttonParams) {
        components.push({
          type: 'button',
          sub_type: button.subType,
          index: button.index,
          parameters: button.params.map((p) => this.buildParameter(p)),
        })
      }
    }

    return this.api.sendTemplate(
      to,
      templateName,
      language,
      components.length > 0 ? components : undefined
    )
  }

  /**
   * Delete a template
   */
  async deleteTemplate(name: string): Promise<{ success: boolean }> {
    const result = await this.api.deleteTemplate(name)

    // Clear from cache
    for (const key of this.templateCache.keys()) {
      if (key.startsWith(`${name}:`)) {
        this.templateCache.delete(key)
      }
    }

    return result
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear()
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  ): Promise<TemplateInfo[]> {
    const templates = await this.getTemplates()
    return templates.filter((t) => t.category === category)
  }

  /**
   * Get approved templates only
   */
  async getApprovedTemplates(): Promise<TemplateInfo[]> {
    return this.getTemplates({ status: 'APPROVED' })
  }

  /**
   * Build parameter object for API
   */
  private buildParameter(param: TemplateParam): TemplateParameter {
    switch (param.type) {
      case 'text':
        return { type: 'text', text: String(param.value) }

      case 'currency':
        if (typeof param.value !== 'object') {
          throw new WhatsAppValidationError('Currency param requires object value')
        }
        return {
          type: 'currency',
          currency: {
            code: param.value.code,
            amount_1000: Math.round(param.value.amount * 1000),
            fallback_value: param.value.fallback,
          },
        }

      case 'date_time':
        return {
          type: 'date_time',
          date_time: { fallback_value: String(param.value) },
        }

      case 'image':
        return { type: 'image', image: { link: String(param.value) } }

      case 'document':
        return { type: 'document', document: { link: String(param.value) } }

      case 'video':
        return { type: 'video', video: { link: String(param.value) } }

      default:
        throw new WhatsAppValidationError(`Unknown parameter type: ${(param as TemplateParam).type}`)
    }
  }
}

export default TemplateService
