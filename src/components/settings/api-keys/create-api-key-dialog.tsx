'use client'

/**
 * Create API Key Dialog
 * PROMPT 32: External Webhooks & Public API System
 */

import { useState } from 'react'
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  Checkbox,
  Box,
  Separator,
} from '@radix-ui/themes'
import { API_SCOPES, type APIScope } from '@/lib/api'

interface CreatedAPIKey {
  id: string
  name: string
  keyPrefix: string
  secret: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

interface CreateAPIKeyDialogProps {
  onCreated: (key: CreatedAPIKey) => void
  onClose: () => void
}

export function CreateAPIKeyDialog({ onCreated, onClose }: CreateAPIKeyDialogProps) {
  const [name, setName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<APIScope[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScopeToggle = (scope: APIScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    )
  }

  const handleSelectAll = () => {
    if (selectedScopes.length === Object.keys(API_SCOPES).length) {
      setSelectedScopes([])
    } else {
      setSelectedScopes(Object.keys(API_SCOPES) as APIScope[])
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (selectedScopes.length === 0) {
      setError('At least one scope is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          scopes: selectedScopes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create API key')
      }

      onCreated(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setLoading(false)
    }
  }

  // Group scopes by category
  const scopesByCategory: Record<string, { scope: APIScope; definition: typeof API_SCOPES[APIScope] }[]> = {}
  Object.entries(API_SCOPES).forEach(([scope, definition]) => {
    if (!scopesByCategory[definition.category]) {
      scopesByCategory[definition.category] = []
    }
    scopesByCategory[definition.category].push({
      scope: scope as APIScope,
      definition,
    })
  })

  return (
    <Dialog.Content style={{ maxWidth: 500 }}>
      <Dialog.Title>Create API Key</Dialog.Title>
      <Dialog.Description size="2" mb="4">
        Create a new API key to access the WhatsApp API programmatically.
      </Dialog.Description>

      <Flex direction="column" gap="4">
        {/* Name Input */}
        <Box>
          <Text as="label" size="2" weight="medium" mb="1">
            Key Name
          </Text>
          <TextField.Root
            placeholder="e.g., Production Backend"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Box>

        {/* Scopes Selection */}
        <Box>
          <Flex justify="between" align="center" mb="2">
            <Text size="2" weight="medium">
              Permissions
            </Text>
            <Button
              variant="ghost"
              size="1"
              onClick={handleSelectAll}
            >
              {selectedScopes.length === Object.keys(API_SCOPES).length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </Flex>

          <Box
            className="max-h-64 overflow-y-auto rounded-lg border p-3"
          >
            {Object.entries(scopesByCategory).map(([category, scopes], index) => (
              <Box key={category}>
                {index > 0 && <Separator my="2" size="4" />}
                <Text size="1" color="gray" weight="medium" mb="1">
                  {category.toUpperCase()}
                </Text>
                <Flex direction="column" gap="2">
                  {scopes.map(({ scope, definition }) => (
                    <Flex
                      key={scope}
                      gap="2"
                      align="start"
                      className="cursor-pointer"
                      onClick={() => handleScopeToggle(scope)}
                    >
                      <Checkbox
                        checked={selectedScopes.includes(scope)}
                        onCheckedChange={() => handleScopeToggle(scope)}
                      />
                      <Box>
                        <Text size="2" weight="medium">
                          {scope}
                        </Text>
                        <Text size="1" color="gray">
                          {definition.description}
                        </Text>
                      </Box>
                    </Flex>
                  ))}
                </Flex>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Error Message */}
        {error && (
          <Text color="red" size="2">
            {error}
          </Text>
        )}

        {/* Actions */}
        <Flex gap="3" justify="end">
          <Button variant="soft" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Key'}
          </Button>
        </Flex>
      </Flex>
    </Dialog.Content>
  )
}
