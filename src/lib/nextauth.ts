import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { verifyPassword } from './auth'
import { env } from './env'

// Define proper types for the database entities
interface UserRole {
  role: {
    name: string
  }
}

interface LawFirm {
  name: string
  isActive: boolean
}

interface User {
  id: string
  isActive: boolean
  lawFirmId: string
  lawFirm: LawFirm
  userRoles: UserRole[]
}

interface PlatformUser {
  id: string
  email: string
  name: string | null
  password: string
  isActive: boolean
  users: User[]
}

interface CustomUser {
  id: string
  email: string
  name?: string
  platformUserId: string
  lawFirmId: string
  lawFirmName: string
  role: string
}

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
          const platformUser = (await prisma.platformUser.findUnique({
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
          })) as PlatformUser | null

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
            const superAdminUser: CustomUser = {
              id: platformUser.id,
              email: platformUser.email,
              name: platformUser.name || undefined,
              platformUserId: platformUser.id,
              lawFirmId: '',
              lawFirmName: 'Platform Administration',
              role: 'super_admin',
            }

            console.log(
              '✅ NextAuth: Returning super admin user:',
              superAdminUser
            )
            return superAdminUser
          }

          // Get the user's primary law firm (first active one)
          console.log('🏢 NextAuth: Checking law firm users:', {
            totalUsers: platformUser.users.length,
            users: platformUser.users.map((u: User) => ({
              id: u.id,
              isActive: u.isActive,
              lawFirmName: u.lawFirm.name,
              lawFirmIsActive: u.lawFirm.isActive,
              roles: u.userRoles.map((ur: UserRole) => ur.role.name),
            })),
          })

          const primaryUser = platformUser.users.find(
            (user: User) => user.lawFirm.isActive && user.isActive
          )

          if (!primaryUser) {
            console.log('❌ NextAuth: No active primary user found')
            console.log('🔍 NextAuth: Debug info:', {
              hasUsers: platformUser.users.length > 0,
              firstUserActive: platformUser.users[0]?.isActive,
              firstLawFirmActive: platformUser.users[0]?.lawFirm.isActive,
              firstUserRoles: platformUser.users[0]?.userRoles.length,
            })
            return null
          }

          console.log('✅ NextAuth: Primary user found:', {
            userId: primaryUser.id,
            lawFirmId: primaryUser.lawFirmId,
            lawFirmName: primaryUser.lawFirm.name,
            roles: primaryUser.userRoles.map((ur: UserRole) => ur.role.name),
          })

          // Get primary role
          const primaryRole = primaryUser.userRoles[0]?.role.name || 'user'

          const userObject: CustomUser = {
            id: primaryUser.id,
            email: platformUser.email,
            name: platformUser.name || undefined,
            platformUserId: platformUser.id,
            lawFirmId: primaryUser.lawFirmId,
            lawFirmName: primaryUser.lawFirm.name,
            role: primaryRole,
          }

          console.log(
            '🎯 NextAuth: About to return law firm user with role:',
            primaryRole
          )

          try {
            return userObject
          } catch (returnError) {
            console.error(
              '💥 NextAuth: Error returning user object:',
              returnError
            )
            return null
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
        console.log('🔄 JWT callback - received user:', {
          id: user.id,
          email: user.email,
          role: (user as CustomUser).role,
          platformUserId: (user as CustomUser).platformUserId,
        })

        // Add token version to invalidate old tokens
        const tokenVersion = Date.now()

        token.platformUserId = (user as CustomUser).platformUserId
        token.lawFirmId = (user as CustomUser).lawFirmId
        token.lawFirmName = (user as CustomUser).lawFirmName
        token.role = (user as CustomUser).role
        token.tokenVersion = tokenVersion

        console.log(
          '🔄 JWT callback - token updated with role:',
          (user as CustomUser).role
        )
      }

      // Validate token version for old tokens
      if (token.email && !token.tokenVersion) {
        console.log('⚠️ Old token detected without version, forcing reauth')
        // Instead of returning null, clear the token properties to force reauth
        return {
          ...token,
          platformUserId: '',
          lawFirmId: '',
          lawFirmName: '',
          role: '',
          tokenVersion: undefined,
        }
      }

      return token
    },
    async session({ session, token }) {
      console.log('🔄 Session callback - token role:', token.role)
      const newSession = {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          platformUserId: token.platformUserId as string,
          lawFirmId: token.lawFirmId as string,
          lawFirmName: token.lawFirmName as string,
          role: token.role as string,
        },
      }
      console.log('🔄 Session callback - returning role:', newSession.user.role)
      return newSession
    },
  },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/login',
  },
}
