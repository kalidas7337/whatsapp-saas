/**
 * WhatsApp Test Send API
 * POST /api/whatsapp/test-send - Send a test message via WhatsApp Cloud API
 */

import { NextRequest, NextResponse } from 'next/server'

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v22.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const TEST_RECIPIENT = process.env.WHATSAPP_TEST_RECIPIENT

export async function POST(request: NextRequest) {
  try {
    // Validate config
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'WhatsApp API not configured. Missing PHONE_NUMBER_ID or ACCESS_TOKEN' },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const recipient = body.to || TEST_RECIPIENT
    const message = body.message || 'Hello from WhatsApp BSP Platform! This is a test message.'

    if (!recipient) {
      return NextResponse.json(
        { error: 'No recipient specified. Provide "to" in request body or set WHATSAPP_TEST_RECIPIENT' },
        { status: 400 }
      )
    }

    // Send message via WhatsApp Cloud API
    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API Error:', data)
      return NextResponse.json(
        {
          error: 'Failed to send message',
          details: data.error || data,
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test message sent successfully!',
      data: {
        messageId: data.messages?.[0]?.id,
        recipient,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Test send error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/whatsapp/test-send',
    method: 'POST',
    description: 'Send a test WhatsApp message',
    config: {
      apiVersion: WHATSAPP_API_VERSION,
      phoneNumberId: PHONE_NUMBER_ID ? '***configured***' : 'NOT SET',
      accessToken: ACCESS_TOKEN ? '***configured***' : 'NOT SET',
      testRecipient: TEST_RECIPIENT || 'NOT SET',
    },
    usage: {
      body: {
        to: '917290819216 (optional, defaults to WHATSAPP_TEST_RECIPIENT)',
        message: 'Your message here (optional)',
      },
    },
  })
}
