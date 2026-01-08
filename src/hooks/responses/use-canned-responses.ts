'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CannedResponse,
  ResponseCategory,
  CreateResponseInput,
  UpdateResponseInput,
} from '@/lib/responses/types'
import { toast } from 'sonner'

interface UseCannedResponsesReturn {
  responses: CannedResponse[]
  categories: ResponseCategory[]
  loading: boolean
  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  createResponse: (input: CreateResponseInput) => Promise<CannedResponse | null>
  updateResponse: (
    id: string,
    input: UpdateResponseInput
  ) => Promise<CannedResponse | null>
  deleteResponse: (id: string) => Promise<boolean>
  recordUsage: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useCannedResponses(): UseCannedResponsesReturn {
  const [responses, setResponses] = useState<CannedResponse[]>([])
  const [categories, setCategories] = useState<ResponseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchResponses = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.set('category', selectedCategory)
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`/api/ai/canned-responses?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()
      setResponses(data.data?.responses || [])
    } catch (error) {
      console.error('Failed to fetch responses:', error)
      toast.error('Failed to load responses')
    }
  }, [selectedCategory, searchQuery])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/canned-responses/categories')
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()
      setCategories(data.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchResponses(), fetchCategories()]).finally(() => {
      setLoading(false)
    })
  }, [fetchResponses, fetchCategories])

  const createResponse = async (
    input: CreateResponseInput
  ): Promise<CannedResponse | null> => {
    try {
      const response = await fetch('/api/ai/canned-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create')
      }

      const data = await response.json()
      toast.success('Response created!')
      await fetchResponses()
      await fetchCategories()
      return data.data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create'
      toast.error(message)
      return null
    }
  }

  const updateResponse = async (
    id: string,
    input: UpdateResponseInput
  ): Promise<CannedResponse | null> => {
    try {
      const response = await fetch(`/api/ai/canned-responses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update')
      }

      const data = await response.json()
      toast.success('Response updated!')
      await fetchResponses()
      return data.data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update'
      toast.error(message)
      return null
    }
  }

  const deleteResponse = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/ai/canned-responses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Response deleted!')
      await fetchResponses()
      await fetchCategories()
      return true
    } catch {
      toast.error('Failed to delete response')
      return false
    }
  }

  const recordUsage = async (id: string): Promise<void> => {
    try {
      await fetch('/api/ai/canned-responses/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId: id }),
      })
    } catch {
      // Silent fail for usage tracking
    }
  }

  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchResponses(), fetchCategories()])
    setLoading(false)
  }, [fetchResponses, fetchCategories])

  return {
    responses,
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    createResponse,
    updateResponse,
    deleteResponse,
    recordUsage,
    refresh,
  }
}
