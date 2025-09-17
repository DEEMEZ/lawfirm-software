import { NextRequest } from 'next/server'
import { verifyToken } from './auth'
import { TenantAwarePrisma } from './db'

export interface TenantContext {
  lawFirmId: string
  userId: string
  userRole: string
  platformUserId: string
}

export async function extractTenantContext(
  request: NextRequest
): Promise<TenantContext | null> {
  try {
    // Get token from header or cookie
    const token =
      request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.headers.get('x-auth-token')

    if (!token) {
      return null
    }

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    // For now, return the context from token
    // In a full implementation, you'd fetch this from the database
    return {
      lawFirmId: payload.lawFirmId || '',
      userId: payload.userId,
      userRole: payload.role || 'user',
      platformUserId: payload.platformUserId || payload.userId,
    }
  } catch (error) {
    console.error('Error extracting tenant context:', error)
    return null
  }
}

export function withTenantContext<T extends unknown[], R>(
  handler: (
    prisma: TenantAwarePrisma,
    context: TenantContext,
    ...args: T
  ) => Promise<R>
) {
  return async (request: NextRequest, ...args: T): Promise<R> => {
    const context = await extractTenantContext(request)

    if (!context) {
      throw new Error('No tenant context available')
    }

    const prisma = new TenantAwarePrisma()
    const tenantPrisma = prisma.forTenant(context.lawFirmId, context.userRole)

    try {
      return await handler(tenantPrisma, context, ...args)
    } finally {
      await tenantPrisma.clearTenantContext()
      await tenantPrisma.$disconnect()
    }
  }
}

// Helper to get tenant-aware Prisma client from headers
export async function getTenantPrisma(request: NextRequest): Promise<{
  prisma: TenantAwarePrisma
  context: TenantContext
} | null> {
  const context = await extractTenantContext(request)

  if (!context) {
    return null
  }

  const prisma = new TenantAwarePrisma()
  const tenantPrisma = prisma.forTenant(context.lawFirmId, context.userRole)

  return {
    prisma: tenantPrisma,
    context,
  }
}
