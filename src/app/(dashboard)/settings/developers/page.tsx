/**
 * Developer Settings Page
 * PROMPT 32: External Webhooks & Public API System
 *
 * API Keys and Webhooks management
 */

import { Heading, Text, Tabs, Box, Card, Flex, Code, Callout } from '@radix-ui/themes'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { APIKeyList } from '@/components/settings/api-keys'
import { WebhookList } from '@/components/settings/webhooks'

export default function DeveloperSettingsPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <Heading size="6">Developer Settings</Heading>
        <Text color="gray" size="2">
          Manage API keys and webhooks for integrations
        </Text>
      </div>

      <Tabs.Root defaultValue="api-keys">
        <Tabs.List>
          <Tabs.Trigger value="api-keys">API Keys</Tabs.Trigger>
          <Tabs.Trigger value="webhooks">Webhooks</Tabs.Trigger>
          <Tabs.Trigger value="documentation">Documentation</Tabs.Trigger>
        </Tabs.List>

        <Box pt="4">
          {/* API Keys Tab */}
          <Tabs.Content value="api-keys">
            <Card>
              <Flex direction="column" gap="4">
                <div>
                  <Heading size="4">API Keys</Heading>
                  <Text size="2" color="gray">
                    Create and manage API keys for programmatic access to the WhatsApp API.
                  </Text>
                </div>
                <APIKeyList />
              </Flex>
            </Card>
          </Tabs.Content>

          {/* Webhooks Tab */}
          <Tabs.Content value="webhooks">
            <Card>
              <Flex direction="column" gap="4">
                <div>
                  <Heading size="4">Webhooks</Heading>
                  <Text size="2" color="gray">
                    Configure webhooks to receive real-time event notifications.
                  </Text>
                </div>
                <WebhookList />
              </Flex>
            </Card>
          </Tabs.Content>

          {/* Documentation Tab */}
          <Tabs.Content value="documentation">
            <Flex direction="column" gap="4">
              {/* API Overview */}
              <Card>
                <Heading size="4" mb="3">API Overview</Heading>
                <Text size="2" color="gray" mb="4">
                  The WhatsApp Business API provides programmatic access to send messages,
                  manage contacts, and handle conversations.
                </Text>

                <Callout.Root color="blue">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    Base URL: <Code>/api/v1</Code>
                  </Callout.Text>
                </Callout.Root>

                <Box mt="4">
                  <Heading size="3" mb="2">Authentication</Heading>
                  <Text size="2" color="gray" mb="2">
                    Include your API key in the Authorization header:
                  </Text>
                  <Code className="block rounded bg-gray-100 p-3 dark:bg-gray-800">
                    Authorization: Bearer your_api_key_here
                  </Code>
                </Box>
              </Card>

              {/* Available Endpoints */}
              <Card>
                <Heading size="4" mb="3">Available Endpoints</Heading>

                <Flex direction="column" gap="4">
                  {/* Messages */}
                  <Box>
                    <Heading size="3" mb="2">Messages</Heading>
                    <Flex direction="column" gap="2">
                      <Flex gap="2" align="center">
                        <Code color="green">GET</Code>
                        <Code>/api/v1/messages</Code>
                        <Text size="2" color="gray">List messages</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="blue">POST</Code>
                        <Code>/api/v1/messages</Code>
                        <Text size="2" color="gray">Send a message</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="green">GET</Code>
                        <Code>/api/v1/messages/:id</Code>
                        <Text size="2" color="gray">Get message details</Text>
                      </Flex>
                    </Flex>
                  </Box>

                  {/* Contacts */}
                  <Box>
                    <Heading size="3" mb="2">Contacts</Heading>
                    <Flex direction="column" gap="2">
                      <Flex gap="2" align="center">
                        <Code color="green">GET</Code>
                        <Code>/api/v1/contacts</Code>
                        <Text size="2" color="gray">List contacts</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="blue">POST</Code>
                        <Code>/api/v1/contacts</Code>
                        <Text size="2" color="gray">Create a contact</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="green">GET</Code>
                        <Code>/api/v1/contacts/:id</Code>
                        <Text size="2" color="gray">Get contact details</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="yellow">PATCH</Code>
                        <Code>/api/v1/contacts/:id</Code>
                        <Text size="2" color="gray">Update a contact</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="red">DELETE</Code>
                        <Code>/api/v1/contacts/:id</Code>
                        <Text size="2" color="gray">Delete a contact</Text>
                      </Flex>
                    </Flex>
                  </Box>

                  {/* Conversations */}
                  <Box>
                    <Heading size="3" mb="2">Conversations</Heading>
                    <Flex direction="column" gap="2">
                      <Flex gap="2" align="center">
                        <Code color="green">GET</Code>
                        <Code>/api/v1/conversations</Code>
                        <Text size="2" color="gray">List conversations</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="green">GET</Code>
                        <Code>/api/v1/conversations/:id</Code>
                        <Text size="2" color="gray">Get conversation details</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="yellow">PATCH</Code>
                        <Code>/api/v1/conversations/:id</Code>
                        <Text size="2" color="gray">Update conversation</Text>
                      </Flex>
                    </Flex>
                  </Box>

                  {/* Templates */}
                  <Box>
                    <Heading size="3" mb="2">Templates</Heading>
                    <Flex direction="column" gap="2">
                      <Flex gap="2" align="center">
                        <Code color="green">GET</Code>
                        <Code>/api/v1/templates</Code>
                        <Text size="2" color="gray">List message templates</Text>
                      </Flex>
                    </Flex>
                  </Box>

                  {/* Broadcasts */}
                  <Box>
                    <Heading size="3" mb="2">Broadcasts</Heading>
                    <Flex direction="column" gap="2">
                      <Flex gap="2" align="center">
                        <Code color="green">GET</Code>
                        <Code>/api/v1/broadcasts</Code>
                        <Text size="2" color="gray">List broadcast campaigns</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="blue">POST</Code>
                        <Code>/api/v1/broadcasts</Code>
                        <Text size="2" color="gray">Create a broadcast</Text>
                      </Flex>
                    </Flex>
                  </Box>

                  {/* Webhooks */}
                  <Box>
                    <Heading size="3" mb="2">Webhooks</Heading>
                    <Flex direction="column" gap="2">
                      <Flex gap="2" align="center">
                        <Code color="green">GET</Code>
                        <Code>/api/v1/webhooks</Code>
                        <Text size="2" color="gray">List webhooks</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="blue">POST</Code>
                        <Code>/api/v1/webhooks</Code>
                        <Text size="2" color="gray">Create a webhook</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="green">GET</Code>
                        <Code>/api/v1/webhooks/:id</Code>
                        <Text size="2" color="gray">Get webhook details</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="yellow">PATCH</Code>
                        <Code>/api/v1/webhooks/:id</Code>
                        <Text size="2" color="gray">Update a webhook</Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Code color="red">DELETE</Code>
                        <Code>/api/v1/webhooks/:id</Code>
                        <Text size="2" color="gray">Delete a webhook</Text>
                      </Flex>
                    </Flex>
                  </Box>
                </Flex>
              </Card>

              {/* Webhook Events */}
              <Card>
                <Heading size="4" mb="3">Webhook Events</Heading>
                <Text size="2" color="gray" mb="4">
                  Subscribe to these events to receive real-time notifications.
                </Text>

                <Flex direction="column" gap="3">
                  <Box>
                    <Heading size="3" mb="1">Messages</Heading>
                    <Flex wrap="wrap" gap="2">
                      <Code>message.received</Code>
                      <Code>message.sent</Code>
                      <Code>message.delivered</Code>
                      <Code>message.read</Code>
                      <Code>message.failed</Code>
                    </Flex>
                  </Box>
                  <Box>
                    <Heading size="3" mb="1">Conversations</Heading>
                    <Flex wrap="wrap" gap="2">
                      <Code>conversation.created</Code>
                      <Code>conversation.assigned</Code>
                      <Code>conversation.resolved</Code>
                      <Code>conversation.reopened</Code>
                    </Flex>
                  </Box>
                  <Box>
                    <Heading size="3" mb="1">Contacts</Heading>
                    <Flex wrap="wrap" gap="2">
                      <Code>contact.created</Code>
                      <Code>contact.updated</Code>
                      <Code>contact.opted_out</Code>
                    </Flex>
                  </Box>
                  <Box>
                    <Heading size="3" mb="1">Campaigns</Heading>
                    <Flex wrap="wrap" gap="2">
                      <Code>campaign.started</Code>
                      <Code>campaign.completed</Code>
                      <Code>campaign.failed</Code>
                    </Flex>
                  </Box>
                </Flex>
              </Card>

              {/* Webhook Signature Verification */}
              <Card>
                <Heading size="4" mb="3">Verifying Webhook Signatures</Heading>
                <Text size="2" color="gray" mb="4">
                  All webhook payloads include an <Code>X-Webhook-Signature</Code> header
                  containing an HMAC-SHA256 signature. Verify this signature to ensure
                  the request is authentic.
                </Text>

                <Box className="rounded bg-gray-100 p-4 dark:bg-gray-800">
                  <pre className="overflow-x-auto text-sm">
{`// Node.js example
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const [timestamp, hash] = signature.split(',');
  const signedPayload = \`\${timestamp}.\${payload}\`;
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return hash === expectedHash;
}`}
                  </pre>
                </Box>
              </Card>

              {/* Rate Limits */}
              <Card>
                <Heading size="4" mb="3">Rate Limits</Heading>
                <Text size="2" color="gray" mb="4">
                  API requests are rate limited to protect the service.
                </Text>

                <Flex direction="column" gap="2">
                  <Text size="2">
                    <strong>Default limit:</strong> 100 requests per minute per API key
                  </Text>
                  <Text size="2">
                    Rate limit headers are included in all responses:
                  </Text>
                  <Flex direction="column" gap="1" className="mt-2">
                    <Code>X-RateLimit-Limit</Code>
                    <Code>X-RateLimit-Remaining</Code>
                    <Code>X-RateLimit-Reset</Code>
                  </Flex>
                </Flex>
              </Card>
            </Flex>
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </div>
  )
}
