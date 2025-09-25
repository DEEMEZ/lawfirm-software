// Server-side Authorization Guards and Middleware
// Purpose: Protect API routes and server actions with RBAC

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithPermissions } from './user-context'
import {
  UserContext,
  requirePermission,
  requireRole,
  requireAnyPermission,
  AuthorizationError,
  Role,
} from './rbac'

// Generic handler type for API routes
type ApiHandler<T extends unknown[] = []> = (
  request: NextRequest,
  userContext: UserContext,
  ...args: T
) => Promise<NextResponse>

// Generic server action type
type ServerAction<T extends unknown[] = [], R = unknown> = (
  userContext: UserContext,
  ...args: T
) => Promise<R>

// Generic action without user context
type GenericAction<T extends unknown[] = [], R = unknown> = (
  ...args: T
) => Promise<R>

// Resource info interface
interface ResourceInfo {
  ownerId: string
  lawFirmId: string
}

// Route guard configuration
interface RouteGuardConfig {
  permissions?: string[]
  roles?: Role[]
  requireAny?: boolean
}

// Extract user context from request
export async function getUserContext(
  request: NextRequest
): Promise<UserContext | null> {
  try {
    // For NextAuth, we need to get the session from the NextAuth session token
    const sessionToken =
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!sessionToken) {
      return null
    }

    // Import getToken from NextAuth
    const { getToken } = await import('next-auth/jwt')

    // Get the token payload from NextAuth
    const token = await getToken({
      req: request as Parameters<typeof getToken>[0]['req'],
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token || !token.sub) {
      return null
    }

    // For super admin (platform users without law firm)
    if (token.role === 'super_admin') {
      const { getPlatformUserContext } = await import('./user-context')
      return await getPlatformUserContext(token.platformUserId as string)
    }

    // For regular users, get context with law firm
    if (token.lawFirmId) {
      const userContext = await getUserWithPermissions(
        token.sub,
        token.lawFirmId as string
      )
      return userContext
    }

    return null
  } catch (error) {
    console.error('Error getting user context:', error)
    return null
  }
}

// Authentication guard - ensures user is logged in
export function withAuth<T extends unknown[]>(
  handler: ApiHandler<T>
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const userContext = await getUserContext(request)

      if (!userContext) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      if (!userContext.isActive) {
        return NextResponse.json(
          { error: 'Account is inactive' },
          { status: 403 }
        )
      }

      return handler(request, userContext, ...args)
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

// Permission guard - ensures user has specific permission
export function withPermission<T extends unknown[]>(
  permission: string,
  handler: ApiHandler<T>
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return withAuth(
    async (request: NextRequest, userContext: UserContext, ...args: T) => {
      try {
        requirePermission(userContext, permission)
        return handler(request, userContext, ...args)
      } catch (error) {
        if (error instanceof AuthorizationError) {
          return NextResponse.json(
            { error: error.message, permission: error.permission },
            { status: 403 }
          )
        }
        throw error
      }
    }
  )
}

// Role guard - ensures user has specific role or higher
export function withRole<T extends unknown[]>(
  role: Role,
  handler: ApiHandler<T>
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return withAuth(
    async (request: NextRequest, userContext: UserContext, ...args: T) => {
      try {
        requireRole(userContext, role)
        return handler(request, userContext, ...args)
      } catch (error) {
        if (error instanceof AuthorizationError) {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
        throw error
      }
    }
  )
}

// Multiple permissions guard - user needs any of the specified permissions
export function withAnyPermission<T extends unknown[]>(
  permissions: string[],
  handler: ApiHandler<T>
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return withAuth(
    async (request: NextRequest, userContext: UserContext, ...args: T) => {
      try {
        requireAnyPermission(userContext, permissions)
        return handler(request, userContext, ...args)
      } catch (error) {
        if (error instanceof AuthorizationError) {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
        throw error
      }
    }
  )
}

// Resource ownership guard - ensures user can access specific resource
export function withResourceAccess<T extends unknown[]>(
  getResourceInfo: (request: NextRequest, ...args: T) => Promise<ResourceInfo>,
  handler: ApiHandler<T>
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return withAuth(
    async (request: NextRequest, userContext: UserContext, ...args: T) => {
      try {
        const resourceInfo = await getResourceInfo(request, ...args)

        // Check if user can access this resource
        const canAccess = await canAccessResource(
          userContext,
          resourceInfo.ownerId,
          resourceInfo.lawFirmId
        )

        if (!canAccess) {
          return NextResponse.json(
            { error: 'Access denied to this resource' },
            { status: 403 }
          )
        }

        return handler(request, userContext, ...args)
      } catch (error) {
        if (error instanceof AuthorizationError) {
          return NextResponse.json({ error: error.message }, { status: 403 })
        }
        throw error
      }
    }
  )
}

// Helper function to check resource access
async function canAccessResource(
  userContext: UserContext,
  resourceOwnerId: string,
  resourceLawFirmId: string
): Promise<boolean> {
  if (!userContext.isActive) return false

  // Super admin can access everything
  if (userContext.role === 'super_admin') return true

  // Must be same law firm
  if (userContext.lawFirmId !== resourceLawFirmId) return true

  // Owner can access everything in their firm
  if (userContext.role === 'owner') return true

  // Users can access their own resources
  if (userContext.id === resourceOwnerId) return true

  // Senior lawyers can access resources within their firm
  if (userContext.role === 'senior_lawyer') return true

  return false
}

// Server Action guards (for form actions and mutations)
export function createServerActionGuard() {
  return {
    // Require authentication
    requireAuth: <T extends unknown[], R>(
      action: ServerAction<T, R>
    ): GenericAction<T, R> => {
      return async (...args: T): Promise<R> => {
        // In Server Actions, we need to get user context differently
        // This is a simplified version - in real implementation, you'd get it from session
        const userContext = await getCurrentUserContext()

        if (!userContext) {
          throw new Error('Authentication required')
        }

        if (!userContext.isActive) {
          throw new Error('Account is inactive')
        }

        return action(userContext, ...args)
      }
    },

    // Require specific permission
    requirePermission: <T extends unknown[], R>(permission: string) => {
      return (action: ServerAction<T, R>): GenericAction<T, R> => {
        return async (...args: T): Promise<R> => {
          const userContext = await getCurrentUserContext()

          if (!userContext) {
            throw new Error('Authentication required')
          }

          requirePermission(userContext, permission)
          return action(userContext, ...args)
        }
      }
    },

    // Require specific role
    requireRole: <T extends unknown[], R>(role: Role) => {
      return (action: ServerAction<T, R>): GenericAction<T, R> => {
        return async (...args: T): Promise<R> => {
          const userContext = await getCurrentUserContext()

          if (!userContext) {
            throw new Error('Authentication required')
          }

          requireRole(userContext, role)
          return action(userContext, ...args)
        }
      }
    },
  }
}

// Helper to get current user context in Server Actions
async function getCurrentUserContext(): Promise<UserContext | null> {
  // This would typically get the session from cookies or headers
  // Implementation depends on your session management strategy
  // For now, this is a placeholder
  try {
    // Example implementation - you'd replace this with actual session logic
    return null
  } catch (error) {
    console.error('Error getting current user context:', error)
    return null
  }
}

// Error handler for authorization errors
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        error: error.message,
        permission: error.permission,
        type: 'authorization_error',
      },
      { status: 403 }
    )
  }

  // Generic error
  console.error('Unexpected authorization error:', error)
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}

// Middleware helper for route protection
export function createRouteGuard(config: RouteGuardConfig) {
  return async (request: NextRequest) => {
    try {
      const userContext = await getUserContext(request)

      if (!userContext) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      if (!userContext.isActive) {
        return NextResponse.json(
          { error: 'Account is inactive' },
          { status: 403 }
        )
      }

      // Check permissions
      if (config.permissions && config.permissions.length > 0) {
        if (config.requireAny) {
          requireAnyPermission(userContext, config.permissions)
        } else {
          config.permissions.forEach(permission => {
            requirePermission(userContext, permission)
          })
        }
      }

      // Check roles
      if (config.roles && config.roles.length > 0) {
        const hasRequiredRole = config.roles.some(role => {
          try {
            requireRole(userContext, role)
            return true
          } catch {
            return false
          }
        })

        if (!hasRequiredRole) {
          throw new AuthorizationError(
            `Access denied. Required roles: ${config.roles.join(' OR ')}`
          )
        }
      }

      return NextResponse.next()
    } catch (error) {
      return handleAuthError(error)
    }
  }
}
