'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CannedResponse } from '@/lib/responses/types'

interface UseQuickRepliesOptions {
  enabled?: boolean
  triggerChar?: string
}

interface UseQuickRepliesReturn {
  isOpen: boolean
  query: string
  suggestions: CannedResponse[]
  selectedIndex: number
  loading: boolean
  handleInputChange: (value: string, cursorPosition: number) => void
  handleKeyDown: (e: KeyboardEvent) => boolean
  selectSuggestion: (index: number) => void
  getSelectedSuggestion: () => CannedResponse | null
  getReplacementInfo: () => { start: number; end: number }
  close: () => void
}

export function useQuickReplies(
  options: UseQuickRepliesOptions = {}
): UseQuickRepliesReturn {
  const { enabled = true, triggerChar = '/' } = options

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<CannedResponse[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const triggerPositionRef = useRef(0)

  /**
   * Handle input change - detect trigger
   */
  const handleInputChange = useCallback(
    (value: string, cursorPosition: number) => {
      if (!enabled) return

      // Find the last trigger character before cursor
      const beforeCursor = value.slice(0, cursorPosition)
      const triggerIndex = beforeCursor.lastIndexOf(triggerChar)

      if (triggerIndex === -1) {
        setIsOpen(false)
        return
      }

      // Check if trigger is at start of word (after space or at beginning)
      const charBeforeTrigger = beforeCursor[triggerIndex - 1]
      if (
        triggerIndex > 0 &&
        charBeforeTrigger !== ' ' &&
        charBeforeTrigger !== '\n'
      ) {
        setIsOpen(false)
        return
      }

      // Extract query after trigger
      const queryStart = triggerIndex + 1
      const queryEnd = cursorPosition
      const currentQuery = value.slice(queryStart, queryEnd)

      // Check for spaces in query (close if user typed space)
      if (currentQuery.includes(' ')) {
        setIsOpen(false)
        return
      }

      triggerPositionRef.current = triggerIndex
      setQuery(currentQuery)
      setIsOpen(true)
      setSelectedIndex(0)
    },
    [enabled, triggerChar]
  )

  /**
   * Fetch suggestions based on query
   */
  useEffect(() => {
    if (!isOpen) return

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const searchQuery = `${triggerChar}${query}`
        const response = await fetch(
          `/api/ai/canned-responses/search?q=${encodeURIComponent(searchQuery)}`
        )
        if (!response.ok) throw new Error('Search failed')

        const data = await response.json()
        setSuggestions(data.data || [])
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 150)
    return () => clearTimeout(debounce)
  }, [isOpen, query, triggerChar])

  /**
   * Handle keyboard navigation
   * Returns true if the event was handled
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent): boolean => {
      if (!isOpen || suggestions.length === 0) return false

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => (i + 1) % suggestions.length)
          return true
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(
            (i) => (i - 1 + suggestions.length) % suggestions.length
          )
          return true
        case 'Enter':
        case 'Tab':
          if (suggestions[selectedIndex]) {
            e.preventDefault()
            return true
          }
          return false
        case 'Escape':
          setIsOpen(false)
          return true
        default:
          return false
      }
    },
    [isOpen, suggestions, selectedIndex]
  )

  /**
   * Select a suggestion by index
   */
  const selectSuggestion = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  /**
   * Get the selected suggestion
   */
  const getSelectedSuggestion = useCallback((): CannedResponse | null => {
    return suggestions[selectedIndex] || null
  }, [suggestions, selectedIndex])

  /**
   * Get replacement info for applying suggestion
   */
  const getReplacementInfo = useCallback(() => {
    return {
      start: triggerPositionRef.current,
      end: triggerPositionRef.current + query.length + 1, // +1 for trigger char
    }
  }, [query])

  /**
   * Close the popup
   */
  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setSuggestions([])
    setSelectedIndex(0)
  }, [])

  return {
    isOpen,
    query,
    suggestions,
    selectedIndex,
    loading,
    handleInputChange,
    handleKeyDown,
    selectSuggestion,
    getSelectedSuggestion,
    getReplacementInfo,
    close,
  }
}
