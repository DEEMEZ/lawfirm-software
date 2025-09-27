import { PrismaClient } from '@prisma/client'

console.log('🔍 PRISMA DEBUG: Importing PrismaClient')
console.log('🔍 PRISMA DEBUG: NODE_ENV =', process.env.NODE_ENV)
console.log(
  '🔍 PRISMA DEBUG: DATABASE_URL exists =',
  !!process.env.DATABASE_URL
)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

console.log('🔍 PRISMA DEBUG: Global prisma exists =', !!globalForPrisma.prisma)

let prismaInstance: PrismaClient

try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ||
            'postgresql://postgres:Ali.rayyan001@localhost:5432/lawfirm_db',
        },
      },
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  console.log('✅ PRISMA DEBUG: PrismaClient created successfully')
  console.log(
    '🔍 PRISMA DEBUG: PrismaClient methods =',
    Object.keys(prismaInstance)
  )
} catch (error) {
  console.error('💥 PRISMA DEBUG: Error creating PrismaClient:', error)
  throw error
}

export const prisma = prismaInstance

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  console.log('🔍 PRISMA DEBUG: Stored in global for development')
}
