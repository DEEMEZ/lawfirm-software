import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { verifyPassword } from './auth'
import { env } from './env'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          console.log('🔍 NextAuth: Attempting login for:', credentials.email)

          // Find platform user
          const platformUser = await prisma.platformUser.findUnique({
            where: { email: credentials.email },
            include: {
              users: {
                include: {
                  lawFirm: true,
                  userRoles: {
                    include: {
                      role: true,
                    },
                  },
                },
              },
            },
          })

          console.log('👤 NextAuth: Platform user found:', !!platformUser)

          if (!platformUser || !platformUser.isActive) {
            console.log('❌ NextAuth: User not found or inactive')
            return null
          }

          // Verify password
          console.log('🔐 NextAuth: Verifying password...')
          const isValidPassword = await verifyPassword(
            credentials.password,
            platformUser.password
          )

          console.log('🔐 NextAuth: Password valid:', isValidPassword)

          if (!isValidPassword) {
            console.log('❌ NextAuth: Invalid password')
            return null
          }

          // Check if this is a super admin (platform user without law firm users)
          if (platformUser.users.length === 0) {
            return {
              id: platformUser.id,
              email: platformUser.email,
              name: platformUser.name || undefined,
              platformUserId: platformUser.id,
              lawFirmId: '',
              lawFirmName: 'Platform Administration',
              role: 'super_admin',
            } as {
              id: string
              email: string
              name?: string
              platformUserId: string
              lawFirmId: string
              lawFirmName: string
              role: string
            }
          }

          // Get the user's primary law firm (first active one)
          const primaryUser = platformUser.users.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (user: any) => user.lawFirm.isActive && user.isActive
          )

          if (!primaryUser) {
            return null
          }

          // Get primary role
          const primaryRole = primaryUser.userRoles[0]?.role.name || 'user'

          return {
            id: primaryUser.id,
            email: platformUser.email,
            name: platformUser.name || undefined,
            platformUserId: platformUser.id,
            lawFirmId: primaryUser.lawFirmId,
            lawFirmName: primaryUser.lawFirm.name,
            role: primaryRole,
          } as {
            id: string
            email: string
            name?: string
            platformUserId: string
            lawFirmId: string
            lawFirmName: string
            role: string
          }
        } catch (error) {
          console.error('💥 NextAuth error:', error)
          if (error instanceof Error) {
            console.error('💥 Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack,
            })
          }
          // Return null instead of throwing to avoid 500 error
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.platformUserId = user.platformUserId
        token.lawFirmId = user.lawFirmId
        token.lawFirmName = user.lawFirmName
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session callback - token:', token)
      const newSession = {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          platformUserId: token.platformUserId,
          lawFirmId: token.lawFirmId,
          lawFirmName: token.lawFirmName,
          role: token.role,
        },
      }
      console.log('Session callback - returning session:', newSession)
      return newSession
    },
  },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/login',
  },
}
