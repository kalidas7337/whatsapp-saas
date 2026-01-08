/**
 * Canned Response Types
 */

export interface CannedResponse {
  id: string
  organizationId: string
  title: string
  content: string
  category: string
  shortcut: string | null
  variables: ResponseVariable[]
  attachments: ResponseAttachment[]
  tags: string[]
  isActive: boolean
  usageCount: number
  successRate: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ResponseVariable {
  name: string
  type: 'text' | 'contact' | 'conversation' | 'custom'
  defaultValue?: string
  description?: string
}

export interface ResponseAttachment {
  type: 'image' | 'document' | 'video'
  url: string
  filename: string
  mimeType: string
}

export interface ResponseCategory {
  id: string
  name: string
  color: string
  icon: string
  responseCount: number
}

export interface CreateResponseInput {
  title: string
  content: string
  category: string
  shortcut?: string
  variables?: ResponseVariable[]
  attachments?: ResponseAttachment[]
  tags?: string[]
}

export interface UpdateResponseInput extends Partial<CreateResponseInput> {
  isActive?: boolean
}

export interface ResponseSearchParams {
  query?: string
  category?: string
  tags?: string[]
  limit?: number
  offset?: number
}

export interface ResolvedResponse {
  original: CannedResponse
  resolvedContent: string
  unresolvedVariables: string[]
}

// API Response types
export interface ResponsesApiResponse {
  responses: CannedResponse[]
  total?: number
}

export interface CategoriesApiResponse {
  categories: ResponseCategory[]
}
