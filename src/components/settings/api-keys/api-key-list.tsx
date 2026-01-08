'use client'

/**
 * API Key List Component
 * PROMPT 32: External Webhooks & Public API System
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Button,
  Badge,
  IconButton,
  Dialog,
  Flex,
  Text,
  Tooltip,
  AlertDialog,
  DropdownMenu,
} from '@radix-ui/themes'
import {
  PlusIcon,
  TrashIcon,
  DotsVerticalIcon,
  CopyIcon,
  EyeOpenIcon,
  EyeClosedIcon,
} from '@radix-ui/react-icons'
import { CreateAPIKeyDialog } from './create-api-key-dialog'

interface APIKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

export function APIKeyList() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null)
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null)
  const [secretVisible, setSecretVisible] = useState(false)

  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/api-keys')
      const data = await response.json()
      if (data.success) {
        setKeys(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleKeyCreated = (key: APIKey & { secret: string }) => {
    setKeys([key, ...keys])
    setNewKeySecret(key.secret)
    setCreateDialogOpen(false)
  }

  const handleRevokeKey = async () => {
    if (!selectedKey) return

    try {
      const response = await fetch(`/api/settings/api-keys/${selectedKey.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setKeys(keys.filter((k) => k.id !== selectedKey.id))
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error)
    } finally {
      setRevokeDialogOpen(false)
      setSelectedKey(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getScopeColor = (scope: string) => {
    if (scope.includes('write')) return 'red'
    if (scope.includes('read')) return 'blue'
    return 'gray'
  }

  if (loading) {
    return (
      <Flex align="center" justify="center" py="9">
        <Text color="gray">Loading API keys...</Text>
      </Flex>
    )
  }

  return (
    <div>
      {/* New Key Secret Display */}
      {newKeySecret && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <Flex direction="column" gap="2">
            <Text weight="bold" color="green">
              API Key Created Successfully
            </Text>
            <Text size="2" color="gray">
              Copy your secret key now. You won&apos;t be able to see it again.
            </Text>
            <Flex gap="2" align="center" className="mt-2">
              <code className="flex-1 rounded bg-gray-100 p-2 font-mono text-sm dark:bg-gray-800">
                {secretVisible ? newKeySecret : '•'.repeat(40)}
              </code>
              <Tooltip content={secretVisible ? 'Hide' : 'Show'}>
                <IconButton
                  variant="ghost"
                  onClick={() => setSecretVisible(!secretVisible)}
                >
                  {secretVisible ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip content="Copy">
                <IconButton
                  variant="ghost"
                  onClick={() => copyToClipboard(newKeySecret)}
                >
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Flex>
            <Button
              variant="soft"
              color="gray"
              size="1"
              className="mt-2 self-start"
              onClick={() => setNewKeySecret(null)}
            >
              Dismiss
            </Button>
          </Flex>
        </div>
      )}

      {/* Header */}
      <Flex justify="between" align="center" mb="4">
        <Text size="2" color="gray">
          {keys.length} API key{keys.length !== 1 ? 's' : ''}
        </Text>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon />
          Create API Key
        </Button>
      </Flex>

      {/* Table */}
      {keys.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py="9"
          className="rounded-lg border border-dashed"
        >
          <Text color="gray" mb="2">
            No API keys yet
          </Text>
          <Button variant="soft" onClick={() => setCreateDialogOpen(true)}>
            <PlusIcon />
            Create your first API key
          </Button>
        </Flex>
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Key</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Scopes</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Last Used</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {keys.map((key) => (
              <Table.Row key={key.id}>
                <Table.Cell>
                  <Text weight="medium">{key.name}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Flex gap="1" align="center">
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                      {key.keyPrefix}...
                    </code>
                    <Tooltip content="Copy prefix">
                      <IconButton
                        variant="ghost"
                        size="1"
                        onClick={() => copyToClipboard(key.keyPrefix)}
                      >
                        <CopyIcon width={12} height={12} />
                      </IconButton>
                    </Tooltip>
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Flex gap="1" wrap="wrap">
                    {key.scopes.slice(0, 3).map((scope) => (
                      <Badge
                        key={scope}
                        color={getScopeColor(scope)}
                        variant="soft"
                        size="1"
                      >
                        {scope}
                      </Badge>
                    ))}
                    {key.scopes.length > 3 && (
                      <Badge color="gray" variant="soft" size="1">
                        +{key.scopes.length - 3}
                      </Badge>
                    )}
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" color="gray">
                    {formatDate(key.lastUsedAt)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    color={key.isActive ? 'green' : 'red'}
                    variant="soft"
                  >
                    {key.isActive ? 'Active' : 'Revoked'}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <IconButton variant="ghost" size="1">
                        <DotsVerticalIcon />
                      </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item
                        color="red"
                        onClick={() => {
                          setSelectedKey(key)
                          setRevokeDialogOpen(true)
                        }}
                      >
                        <TrashIcon />
                        Revoke Key
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}

      {/* Create Dialog */}
      <Dialog.Root open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <CreateAPIKeyDialog
          onCreated={handleKeyCreated}
          onClose={() => setCreateDialogOpen(false)}
        />
      </Dialog.Root>

      {/* Revoke Confirmation */}
      <AlertDialog.Root open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialog.Content>
          <AlertDialog.Title>Revoke API Key</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to revoke &quot;{selectedKey?.name}&quot;? This action
            cannot be undone and any applications using this key will stop
            working.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={handleRevokeKey}>
                Revoke Key
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  )
}
