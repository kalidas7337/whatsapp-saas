'use client'

/**
 * Webhook List Component
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
  Switch,
} from '@radix-ui/themes'
import {
  PlusIcon,
  TrashIcon,
  DotsVerticalIcon,
  ReloadIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  PlayIcon,
} from '@radix-ui/react-icons'
import { CreateWebhookDialog } from './create-webhook-dialog'
import { WebhookDetailDialog } from './webhook-detail-dialog'

interface Webhook {
  id: string
  url: string
  events: string[]
  isActive: boolean
  description: string | null
  failureCount: number
  lastTriggeredAt: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  createdAt: string
}

interface EventType {
  event: string
  name: string
  description: string
  category: string
}

export function WebhookList() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{
    id: string
    success: boolean
    statusCode?: number
    responseTime?: number
    error?: string
  } | null>(null)

  const fetchWebhooks = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/webhooks')
      const data = await response.json()
      if (data.success) {
        setWebhooks(data.data)
        setEventTypes(data.eventTypes || [])
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWebhooks()
  }, [fetchWebhooks])

  const handleWebhookCreated = (webhook: Webhook & { secret: string }) => {
    setWebhooks([webhook, ...webhooks])
    setCreateDialogOpen(false)
  }

  const handleToggleActive = async (webhook: Webhook) => {
    try {
      const response = await fetch(`/api/settings/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      })

      if (response.ok) {
        setWebhooks(
          webhooks.map((w) =>
            w.id === webhook.id ? { ...w, isActive: !w.isActive } : w
          )
        )
      }
    } catch (error) {
      console.error('Failed to toggle webhook:', error)
    }
  }

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return

    try {
      const response = await fetch(
        `/api/settings/webhooks/${selectedWebhook.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setWebhooks(webhooks.filter((w) => w.id !== selectedWebhook.id))
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error)
    } finally {
      setDeleteDialogOpen(false)
      setSelectedWebhook(null)
    }
  }

  const handleTestWebhook = async (webhook: Webhook) => {
    setTestingId(webhook.id)
    setTestResult(null)

    try {
      const response = await fetch(
        `/api/settings/webhooks/${webhook.id}/test`,
        { method: 'POST' }
      )
      const data = await response.json()

      setTestResult({
        id: webhook.id,
        success: data.data.success,
        statusCode: data.data.statusCode,
        responseTime: data.data.responseTime,
        error: data.data.error,
      })
    } catch (err) {
      console.error('Webhook test failed:', err)
      setTestResult({
        id: webhook.id,
        success: false,
        error: 'Failed to send test request',
      })
    } finally {
      setTestingId(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncateUrl = (url: string, maxLength = 40) => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <Flex align="center" justify="center" py="9">
        <Text color="gray">Loading webhooks...</Text>
      </Flex>
    )
  }

  return (
    <div>
      {/* Test Result Banner */}
      {testResult && (
        <div
          className={`mb-4 rounded-lg border p-4 ${
            testResult.success
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          }`}
        >
          <Flex gap="2" align="center">
            {testResult.success ? (
              <CheckCircledIcon className="h-5 w-5 text-green-600" />
            ) : (
              <CrossCircledIcon className="h-5 w-5 text-red-600" />
            )}
            <Text weight="medium" color={testResult.success ? 'green' : 'red'}>
              {testResult.success ? 'Webhook test successful' : 'Webhook test failed'}
            </Text>
            {testResult.statusCode && (
              <Badge color={testResult.success ? 'green' : 'red'}>
                HTTP {testResult.statusCode}
              </Badge>
            )}
            {testResult.responseTime && (
              <Text size="2" color="gray">
                {testResult.responseTime}ms
              </Text>
            )}
            {testResult.error && (
              <Text size="2" color="red">
                {testResult.error}
              </Text>
            )}
            <Button
              variant="ghost"
              size="1"
              className="ml-auto"
              onClick={() => setTestResult(null)}
            >
              Dismiss
            </Button>
          </Flex>
        </div>
      )}

      {/* Header */}
      <Flex justify="between" align="center" mb="4">
        <Text size="2" color="gray">
          {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''}
        </Text>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon />
          Create Webhook
        </Button>
      </Flex>

      {/* Table */}
      {webhooks.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py="9"
          className="rounded-lg border border-dashed"
        >
          <Text color="gray" mb="2">
            No webhooks configured
          </Text>
          <Button variant="soft" onClick={() => setCreateDialogOpen(true)}>
            <PlusIcon />
            Create your first webhook
          </Button>
        </Flex>
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>URL</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Events</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Last Triggered</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Active</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {webhooks.map((webhook) => (
              <Table.Row key={webhook.id}>
                <Table.Cell>
                  <Tooltip content={webhook.url}>
                    <Text size="2" className="font-mono">
                      {truncateUrl(webhook.url)}
                    </Text>
                  </Tooltip>
                  {webhook.description && (
                    <Text size="1" color="gray" className="block">
                      {webhook.description}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Flex gap="1" wrap="wrap">
                    {webhook.events.slice(0, 2).map((event) => (
                      <Badge key={event} variant="soft" size="1">
                        {event.split('.')[0]}
                      </Badge>
                    ))}
                    {webhook.events.length > 2 && (
                      <Badge color="gray" variant="soft" size="1">
                        +{webhook.events.length - 2}
                      </Badge>
                    )}
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  {webhook.failureCount > 0 ? (
                    <Tooltip content={`${webhook.failureCount} consecutive failures`}>
                      <Badge color="red" variant="soft">
                        Failing
                      </Badge>
                    </Tooltip>
                  ) : webhook.lastSuccessAt ? (
                    <Badge color="green" variant="soft">
                      Healthy
                    </Badge>
                  ) : (
                    <Badge color="gray" variant="soft">
                      Not triggered
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" color="gray">
                    {formatDate(webhook.lastTriggeredAt)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Switch
                    checked={webhook.isActive}
                    onCheckedChange={() => handleToggleActive(webhook)}
                  />
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
                        onClick={() => {
                          setSelectedWebhook(webhook)
                          setDetailDialogOpen(true)
                        }}
                      >
                        View Details
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onClick={() => handleTestWebhook(webhook)}
                        disabled={testingId === webhook.id}
                      >
                        <PlayIcon />
                        {testingId === webhook.id ? 'Testing...' : 'Test Webhook'}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onClick={() => fetchWebhooks()}
                      >
                        <ReloadIcon />
                        Refresh
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        color="red"
                        onClick={() => {
                          setSelectedWebhook(webhook)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <TrashIcon />
                        Delete
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
        <CreateWebhookDialog
          eventTypes={eventTypes}
          onCreated={handleWebhookCreated}
          onClose={() => setCreateDialogOpen(false)}
        />
      </Dialog.Root>

      {/* Detail Dialog */}
      <Dialog.Root open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        {selectedWebhook && (
          <WebhookDetailDialog
            webhookId={selectedWebhook.id}
            onClose={() => {
              setDetailDialogOpen(false)
              setSelectedWebhook(null)
            }}
          />
        )}
      </Dialog.Root>

      {/* Delete Confirmation */}
      <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete Webhook</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete this webhook? This action cannot be
            undone and you will stop receiving events at this URL.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={handleDeleteWebhook}>
                Delete Webhook
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  )
}
