import { PrismaClient } from '@prisma/client'
import { env } from './env'

export class TenantAwarePrisma extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
    })
  }

  async setTenantContext(lawFirmId: string, userRole: string = 'user') {
    // Set the tenant context using PostgreSQL session variables
    await this.$executeRaw`SELECT set_tenant_context(${lawFirmId}, ${userRole})`
  }

  async clearTenantContext() {
    await this.$executeRaw`SELECT clear_tenant_context()`
  }

  // Create a tenant-aware instance
  forTenant(lawFirmId: string, userRole: string = 'user') {
    const client = new TenantAwarePrisma()

    // Wrap all query methods to automatically set context
    const originalMethods = [
      'findFirst',
      'findFirstOrThrow',
      'findUnique',
      'findUniqueOrThrow',
      'findMany',
      'create',
      'createMany',
      'update',
      'updateMany',
      'upsert',
      'delete',
      'deleteMany',
      'count',
      'aggregate',
      'groupBy',
      'findRaw',
      'aggregateRaw',
    ]

    // Intercept all model operations
    Object.keys(client).forEach(modelName => {
      const model = (client as unknown as Record<string, unknown>)[modelName]
      if (model && typeof model === 'object') {
        originalMethods.forEach(method => {
          if (
            typeof (model as Record<string, unknown>)[method] === 'function'
          ) {
            const originalMethod = (
              (model as Record<string, unknown>)[method] as (
                ...args: unknown[]
              ) => Promise<unknown>
            ).bind(model)
            ;(model as Record<string, unknown>)[method] = async (
              ...args: unknown[]
            ) => {
              await client.setTenantContext(lawFirmId, userRole)
              try {
                return await originalMethod(...args)
              } finally {
                // Keep context for the duration of the request
                // It will be cleared by middleware or manually
              }
            }
          }
        })
      }
    })

    return client
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: TenantAwarePrisma | undefined
}

export const prisma = globalForPrisma.prisma ?? new TenantAwarePrisma()

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
