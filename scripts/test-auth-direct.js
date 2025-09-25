// Direct test of NextAuth logic for superadmin
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

// Import Prisma client
const { PrismaClient } = require(
  path.resolve(__dirname, '../src/generated/prisma')
)
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

console.log('🔍 Testing NextAuth logic for superadmin...')

try {
  // Simulate the NextAuth authorize function logic
  const credentials = {
    email: 'superadmin@lawfirm.com',
    password: 'superadmin123',
  }

  console.log('📧 Looking up platform user:', credentials.email)

  // Find platform user (same query as NextAuth)
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

  if (!platformUser) {
    console.log('❌ Platform user not found')
    process.exit(1)
  }

  console.log('✅ Platform user found')
  console.log('📊 Platform user data:', {
    id: platformUser.id,
    email: platformUser.email,
    name: platformUser.name,
    isActive: platformUser.isActive,
    usersCount: platformUser.users.length,
  })

  // Verify password (same as NextAuth)
  const isValidPassword = await bcrypt.compare(
    credentials.password,
    platformUser.password
  )
  console.log('🔐 Password valid:', isValidPassword)

  if (!isValidPassword) {
    console.log('❌ Invalid password')
    process.exit(1)
  }

  // Check if this is a super admin (same logic as NextAuth)
  console.log('👑 Checking superadmin status...')
  console.log('👥 Number of law firm users:', platformUser.users.length)

  if (platformUser.users.length === 0) {
    console.log('✅ SUPERADMIN DETECTED! (No law firm users)')
    const userObject = {
      id: platformUser.id,
      email: platformUser.email,
      name: platformUser.name || undefined,
      platformUserId: platformUser.id,
      lawFirmId: '',
      lawFirmName: 'Platform Administration',
      role: 'super_admin',
    }
    console.log('🎯 User object that NextAuth would create:', userObject)
    console.log('✅ This should work with admin APIs!')
  } else {
    console.log('❌ Not a superadmin - has law firm users')
    console.log(
      '👥 Law firm users:',
      platformUser.users.map(u => ({
        id: u.id,
        lawFirmName: u.lawFirm.name,
        roles: u.userRoles.map(ur => ur.role.name),
      }))
    )
  }
} catch (error) {
  console.error('❌ Error:', error)
} finally {
  await prisma.$disconnect()
}
