'use client'

/**
 * Webhook Detail Dialog
 * PROMPT 32: External Webhooks & Public API System
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  Button,
  Flex,
  Text,
  Badge,
  Box,
  Table,
  Tabs,
  Progress,
  AlertDialog,
  Callout,
} from '@radix-ui/themes'
import {
  ReloadIcon,
  CopyIcon,
  ExclamationTriangleIcon,
} from '@radix-ui/react-icons'

interface WebhookStats {
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  successRate: number
  last24Hours: number
}

interface WebhookDelivery {
  id: string
  event: string
  status: 'pending' | 'success' | 'failed'
  statusCode?: number
  response?: string
  attempts: number
  createdAt: string
  deliveredAt?: string
}

interface WebhookDetail {
  id: string
  url: string
  events: string[]
  isActive: boolean
  description: string | null
  headers: Record<string, string> | null
  failureCount: number
  lastTriggeredAt: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  createdAt: string
  updatedAt: string
  stats: WebhookStats
  deliveries: WebhookDelivery[]
}

interface WebhookDetailDialogProps {
  webhookId: string
  onClose: () => void
}

export function WebhookDetailDialog({
  webhookId,
  onClose,
}: WebhookDetailDialogProps) {
  const [webhook, setWebhook] = useState<WebhookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)

  const fetchWebhook = useCallback(async () => {
    try {
      const response = await fetch(`/api/settings/webhooks/${webhookId}`)
      const data = await response.json()
      if (data.success) {
        setWebhook(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch webhook:', error)
    } finally {
      setLoading(false)
    }
  }, [webhookId])

  useEffect(() => {
    fetchWebhook()
  }, [fetchWebhook])

  const handleRotateSecret = async () => {
    try {
      const response = await fetch(
        `/api/settings/webhooks/${webhookId}/rotate-secret`,
        { method: 'POST' }
      )
      const data = await response.json()
      if (data.success) {
        setNewSecret(data.data.secret)
      }
    } catch (error) {
      console.error('Failed to rotate secret:', error)
    } finally {
      setRotateDialogOpen(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'green'
      case 'failed':
        return 'red'
      default:
        return 'yellow'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <Dialog.Content style={{ maxWidth: 700 }}>
        <Flex align="center" justify="center" py="9">
          <Text color="gray">Loading webhook details...</Text>
        </Flex>
      </Dialog.Content>
    )
  }

  if (!webhook) {
    return (
      <Dialog.Content style={{ maxWidth: 700 }}>
        <Dialog.Title>Webhook Not Found</Dialog.Title>
        <Button onClick={onClose}>Close</Button>
      </Dialog.Content>
    )
  }

  return (
    <Dialog.Content style={{ maxWidth: 700 }}>
      <Flex justify="between" align="start">
        <div>
          <Dialog.Title>Webhook Details</Dialog.Title>
          <Dialog.Description size="2">
            {webhook.description || 'No description'}
          </Dialog.Description>
        </div>
        <Badge color={webhook.isActive ? 'green' : 'gray'}>
          {webhook.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </Flex>

      {/* New Secret Banner */}
      {newSecret && (
        <Callout.Root color="green" mt="4">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>
            <Text weight="bold">New signing secret generated!</Text>
            <Flex gap="2" align="center" mt="2">
              <code className="rounded bg-gray-100 p-1 font-mono text-sm dark:bg-gray-800">
                {newSecret}
              </code>
              <Button
                variant="ghost"
                size="1"
                onClick={() => copyToClipboard(newSecret)}
              >
                <CopyIcon />
              </Button>
            </Flex>
            <Text size="1" color="gray" mt="1">
              Copy this secret now. It won&apos;t be shown again.
            </Text>
          </Callout.Text>
        </Callout.Root>
      )}

      <Tabs.Root defaultValue="overview" className="mt-4">
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="deliveries">
            Deliveries ({webhook.deliveries.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        </Tabs.List>

        <Box pt="4">
          {/* Overview Tab */}
          <Tabs.Content value="overview">
            <Flex direction="column" gap="4">
              {/* Stats */}
              <Flex gap="4">
                <Box className="flex-1 rounded-lg border p-4">
                  <Text size="2" color="gray">
                    Total Deliveries
                  </Text>
                  <Text size="6" weight="bold">
                    {webhook.stats.totalDeliveries}
                  </Text>
                </Box>
                <Box className="flex-1 rounded-lg border p-4">
                  <Text size="2" color="gray">
                    Success Rate
                  </Text>
                  <Text
                    size="6"
                    weight="bold"
                    color={webhook.stats.successRate >= 90 ? 'green' : 'red'}
                  >
                    {webhook.stats.successRate.toFixed(1)}%
                  </Text>
                </Box>
                <Box className="flex-1 rounded-lg border p-4">
                  <Text size="2" color="gray">
                    Last 24 Hours
                  </Text>
                  <Text size="6" weight="bold">
                    {webhook.stats.last24Hours}
                  </Text>
                </Box>
              </Flex>

              {/* Success Rate Progress */}
              <Box>
                <Flex justify="between" mb="1">
                  <Text size="2">Delivery Success Rate</Text>
                  <Text size="2" color="gray">
                    {webhook.stats.successfulDeliveries} / {webhook.stats.totalDeliveries}
                  </Text>
                </Flex>
                <Progress
                  value={webhook.stats.successRate}
                  color={webhook.stats.successRate >= 90 ? 'green' : 'red'}
                />
              </Box>

              {/* URL */}
              <Box>
                <Text size="2" color="gray" mb="1">
                  Endpoint URL
                </Text>
                <Flex gap="2" align="center">
                  <code className="flex-1 rounded bg-gray-100 p-2 font-mono text-sm dark:bg-gray-800">
                    {webhook.url}
                  </code>
                  <Button
                    variant="ghost"
                    size="1"
                    onClick={() => copyToClipboard(webhook.url)}
                  >
                    <CopyIcon />
                  </Button>
                </Flex>
              </Box>

              {/* Events */}
              <Box>
                <Text size="2" color="gray" mb="1">
                  Subscribed Events
                </Text>
                <Flex gap="1" wrap="wrap">
                  {webhook.events.map((event) => (
                    <Badge key={event} variant="soft">
                      {event}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* Timestamps */}
              <Flex gap="4">
                <Box>
                  <Text size="2" color="gray">
                    Last Triggered
                  </Text>
                  <Text size="2">{formatDate(webhook.lastTriggeredAt)}</Text>
                </Box>
                <Box>
                  <Text size="2" color="gray">
                    Last Success
                  </Text>
                  <Text size="2" color="green">
                    {formatDate(webhook.lastSuccessAt)}
                  </Text>
                </Box>
                <Box>
                  <Text size="2" color="gray">
                    Last Failure
                  </Text>
                  <Text size="2" color="red">
                    {formatDate(webhook.lastFailureAt)}
                  </Text>
                </Box>
              </Flex>
            </Flex>
          </Tabs.Content>

          {/* Deliveries Tab */}
          <Tabs.Content value="deliveries">
            {webhook.deliveries.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                py="9"
                className="rounded-lg border border-dashed"
              >
                <Text color="gray">No deliveries yet</Text>
              </Flex>
            ) : (
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Event</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Response</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Attempts</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {webhook.deliveries.map((delivery) => (
                    <Table.Row key={delivery.id}>
                      <Table.Cell>
                        <Badge variant="soft">{delivery.event}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getStatusColor(delivery.status)}>
                          {delivery.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {delivery.statusCode ? (
                          <Text size="2">HTTP {delivery.statusCode}</Text>
                        ) : delivery.response ? (
                          <Text size="2" color="red">
                            {delivery.response.substring(0, 30)}...
                          </Text>
                        ) : (
                          <Text size="2" color="gray">
                            -
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2">{delivery.attempts}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {formatDate(delivery.createdAt)}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Tabs.Content>

          {/* Settings Tab */}
          <Tabs.Content value="settings">
            <Flex direction="column" gap="4">
              {/* Signing Secret */}
              <Box>
                <Text size="2" weight="medium" mb="2">
                  Signing Secret
                </Text>
                <Text size="2" color="gray" mb="2">
                  Use this to verify webhook signatures. If compromised, rotate
                  immediately.
                </Text>
                <Button
                  variant="soft"
                  color="red"
                  onClick={() => setRotateDialogOpen(true)}
                >
                  <ReloadIcon />
                  Rotate Secret
                </Button>
              </Box>

              {/* Custom Headers */}
              {webhook.headers && Object.keys(webhook.headers).length > 0 && (
                <Box>
                  <Text size="2" weight="medium" mb="2">
                    Custom Headers
                  </Text>
                  <Box className="rounded-lg border p-3">
                    {Object.entries(webhook.headers).map(([key, value]) => (
                      <Flex key={key} gap="2">
                        <Text size="2" weight="medium">
                          {key}:
                        </Text>
                        <Text size="2" color="gray">
                          {value}
                        </Text>
                      </Flex>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Metadata */}
              <Box>
                <Text size="2" color="gray">
                  Created {formatDate(webhook.createdAt)}
                </Text>
                <Text size="2" color="gray">
                  Updated {formatDate(webhook.updatedAt)}
                </Text>
              </Box>
            </Flex>
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      <Flex justify="end" mt="4">
        <Button variant="soft" color="gray" onClick={onClose}>
          Close
        </Button>
      </Flex>

      {/* Rotate Secret Confirmation */}
      <AlertDialog.Root
        open={rotateDialogOpen}
        onOpenChange={setRotateDialogOpen}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Rotate Webhook Secret</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to rotate the signing secret? The old secret
            will immediately stop working and you&apos;ll need to update your
            application with the new secret.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={handleRotateSecret}>
                Rotate Secret
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Dialog.Content>
  )
}
