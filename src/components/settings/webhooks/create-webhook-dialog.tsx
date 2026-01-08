'use client'

/**
 * Create Webhook Dialog
 * PROMPT 32: External Webhooks & Public API System
 */

import { useState } from 'react'
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  TextArea,
  Checkbox,
  Box,
  Separator,
  Callout,
} from '@radix-ui/themes'
import {
  CopyIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  InfoCircledIcon,
} from '@radix-ui/react-icons'

interface EventType {
  event: string
  name: string
  description: string
  category: string
}

interface CreatedWebhook {
  id: string
  url: string
  secret: string
  events: string[]
  isActive: boolean
  description: string | null
  failureCount: number
  lastTriggeredAt: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  createdAt: string
}

interface CreateWebhookDialogProps {
  eventTypes: EventType[]
  onCreated: (webhook: CreatedWebhook) => void
  onClose: () => void
}

export function CreateWebhookDialog({
  eventTypes,
  onCreated,
  onClose,
}: CreateWebhookDialogProps) {
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [secretVisible, setSecretVisible] = useState(false)

  const handleEventToggle = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    )
  }

  const handleSelectAll = () => {
    if (selectedEvents.length === eventTypes.length) {
      setSelectedEvents([])
    } else {
      setSelectedEvents(eventTypes.map((e) => e.event))
    }
  }

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('URL is required')
      return
    }

    try {
      new URL(url)
    } catch {
      setError('Invalid URL format')
      return
    }

    if (selectedEvents.length === 0) {
      setError('At least one event is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/settings/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          events: selectedEvents,
          description: description.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create webhook')
      }

      setCreatedSecret(data.data.secret)
      onCreated(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Group events by category
  const eventsByCategory: Record<string, EventType[]> = {}
  eventTypes.forEach((event) => {
    if (!eventsByCategory[event.category]) {
      eventsByCategory[event.category] = []
    }
    eventsByCategory[event.category].push(event)
  })

  // If secret was created, show success state
  if (createdSecret) {
    return (
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>Webhook Created Successfully</Dialog.Title>

        <Callout.Root color="amber" mt="4">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Copy your signing secret now. You won&apos;t be able to see it again.
          </Callout.Text>
        </Callout.Root>

        <Box mt="4">
          <Text size="2" weight="medium" mb="2">
            Signing Secret
          </Text>
          <Flex gap="2" align="center">
            <code className="flex-1 rounded bg-gray-100 p-2 font-mono text-sm dark:bg-gray-800">
              {secretVisible ? createdSecret : '•'.repeat(40)}
            </code>
            <Button
              variant="ghost"
              size="1"
              onClick={() => setSecretVisible(!secretVisible)}
            >
              {secretVisible ? <EyeClosedIcon /> : <EyeOpenIcon />}
            </Button>
            <Button
              variant="ghost"
              size="1"
              onClick={() => copyToClipboard(createdSecret)}
            >
              <CopyIcon />
            </Button>
          </Flex>
        </Box>

        <Text size="2" color="gray" mt="4">
          Use this secret to verify webhook signatures in your application.
          All webhook payloads include an <code>X-Webhook-Signature</code> header.
        </Text>

        <Flex justify="end" mt="4">
          <Button onClick={onClose}>Done</Button>
        </Flex>
      </Dialog.Content>
    )
  }

  return (
    <Dialog.Content style={{ maxWidth: 500 }}>
      <Dialog.Title>Create Webhook</Dialog.Title>
      <Dialog.Description size="2" mb="4">
        Configure a webhook to receive real-time event notifications.
      </Dialog.Description>

      <Flex direction="column" gap="4">
        {/* URL Input */}
        <Box>
          <Text as="label" size="2" weight="medium" mb="1">
            Endpoint URL
          </Text>
          <TextField.Root
            placeholder="https://your-server.com/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Text size="1" color="gray" mt="1">
            Must be a publicly accessible HTTPS URL
          </Text>
        </Box>

        {/* Description */}
        <Box>
          <Text as="label" size="2" weight="medium" mb="1">
            Description (Optional)
          </Text>
          <TextArea
            placeholder="e.g., Production notifications"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </Box>

        {/* Events Selection */}
        <Box>
          <Flex justify="between" align="center" mb="2">
            <Text size="2" weight="medium">
              Events to Subscribe
            </Text>
            <Button variant="ghost" size="1" onClick={handleSelectAll}>
              {selectedEvents.length === eventTypes.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </Flex>

          <Box className="max-h-64 overflow-y-auto rounded-lg border p-3">
            {Object.entries(eventsByCategory).map(([category, events], index) => (
              <Box key={category}>
                {index > 0 && <Separator my="2" size="4" />}
                <Text size="1" color="gray" weight="medium" mb="1">
                  {category.toUpperCase()}
                </Text>
                <Flex direction="column" gap="2">
                  {events.map((event) => (
                    <Flex
                      key={event.event}
                      gap="2"
                      align="start"
                      className="cursor-pointer"
                      onClick={() => handleEventToggle(event.event)}
                    >
                      <Checkbox
                        checked={selectedEvents.includes(event.event)}
                        onCheckedChange={() => handleEventToggle(event.event)}
                      />
                      <Box>
                        <Text size="2" weight="medium">
                          {event.event}
                        </Text>
                        <Text size="1" color="gray">
                          {event.description}
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
            {loading ? 'Creating...' : 'Create Webhook'}
          </Button>
        </Flex>
      </Flex>
    </Dialog.Content>
  )
}
