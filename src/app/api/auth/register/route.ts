import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.users.findFirst({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate IDs
    const firmId = `firm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const firmUserId = `fu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const displayName = name || email.split('@')[0]

    // Create CA firm (organization) - must use ca_firms for auth to work
    await prisma.ca_firms.create({
      data: {
        id: firmId,
        firm_name: `${displayName}'s Workspace`,
        owner_name: displayName,
        owner_email: email,
        subscription_plan: 'STARTER',
        subscription_status: 'TRIAL',
        subdomain: `ws-${Date.now()}`,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
        updatedAt: new Date(),
      },
    })

    // Create user linked to the firm
    await prisma.users.create({
      data: {
        id: userId,
        email,
        name: displayName,
        password: hashedPassword,
        firm_id: firmId,
        updatedAt: new Date(),
      },
    })

    // Create ca_firm_users linking record (required for auth to find organizationId)
    await prisma.ca_firm_users.create({
      data: {
        id: firmUserId,
        ca_firm_id: firmId,
        user_id: userId,
        role: 'ADMIN',
        can_create_clients: true,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully.',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
