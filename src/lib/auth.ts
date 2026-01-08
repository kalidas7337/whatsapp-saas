import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        // Find user by email
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.isActive) {
          throw new Error('Invalid credentials')
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        // Get user's organization (ca_firm) via ca_firm_users
        const firmUser = await prisma.ca_firm_users.findFirst({
          where: { user_id: user.id },
          include: { ca_firms: true },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: firmUser?.ca_firm_id || null,
          organizationName: firmUser?.ca_firms.firm_name || null,
          role: firmUser?.role || 'STAFF',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        const userData = user as { organizationId?: string; organizationName?: string; role?: string }
        token.organizationId = userData.organizationId
        token.organizationName = userData.organizationName
        token.role = userData.role
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.organizationId = token.organizationId as string
        session.user.organizationName = token.organizationName as string
        session.user.role = token.role as string
      }
      return session
    },
    async signIn({ user, account }) {
      // Handle Google OAuth sign in
      if (account?.provider === 'google' && user.email) {
        // Check if user exists
        const existingUser = await prisma.users.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          // Create new user and organization for Google sign in
          const firmId = `firm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          const firmUserId = `fu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

          await prisma.ca_firms.create({
            data: {
              id: firmId,
              firm_name: `${user.name}'s Workspace`,
              owner_name: user.name || 'User',
              owner_email: user.email,
              subscription_plan: 'STARTER',
              subscription_status: 'TRIAL',
              subdomain: `ws-${Date.now()}`,
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
          })

          await prisma.users.create({
            data: {
              id: userId,
              email: user.email,
              name: user.name || 'User',
              password: '', // No password for OAuth users
              avatar: user.image || undefined,
              firm_id: firmId,
              updatedAt: new Date(),
            },
          })

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
        }
      }
      return true
    },
  },
}

// Type augmentation for session
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image?: string | null
      organizationId: string | null
      organizationName: string | null
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    organizationId?: string | null
    organizationName?: string | null
    role?: string
  }
}
