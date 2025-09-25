// Super Admin Creation Script
// Purpose: Create a superadmin user with global system access

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

// Import Prisma client
let PrismaClient
try {
  const prismaPath = path.resolve(__dirname, '../src/generated/prisma')
  const { PrismaClient: PC } = require(prismaPath)
  PrismaClient = PC
} catch (error) {
  console.error('⚠️ Prisma client not found. Run "npx prisma generate" first.')
  console.error('Error details:', error.message)
  process.exit(1)
}

let bcrypt
try {
  bcrypt = require('bcryptjs')
} catch {
  console.error(
    '⚠️ bcryptjs not found. It should be installed as a dependency.'
  )
  process.exit(1)
}

const prisma = new PrismaClient()

// Super admin permissions (all possible permissions)
const SUPERADMIN_PERMISSIONS = [
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  'users.manage_roles',
  'cases.view',
  'cases.view_all',
  'cases.create',
  'cases.edit',
  'cases.delete',
  'cases.assign',
  'documents.view',
  'documents.upload',
  'documents.edit',
  'documents.delete',
  'documents.manage_permissions',
  'calendar.view',
  'calendar.view_all',
  'calendar.create',
  'calendar.edit',
  'calendar.delete',
  'tasks.view',
  'tasks.create',
  'tasks.edit',
  'tasks.delete',
  'tasks.assign',
  'admin.firm_settings',
  'admin.workspaces',
  'admin.audit_logs',
  'system.manage_firms',
  'system.manage_platform_users',
  'system.global_access',
]

// Create superadmin function
async function createSuperAdmin() {
  const superadminEmail = 'superadmin@lawfirm.com'
  const superadminPassword = 'superadmin123'
  const superadminName = 'Super Administrator'

  console.log('🔧 Creating superadmin user...')

  try {
    // Start transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Check if superadmin already exists
      const existingUser = await tx.platformUser.findUnique({
        where: { email: superadminEmail },
      })

      if (existingUser) {
        console.log('⚠️ Superadmin user already exists. Skipping creation.')
        return { existingUser, message: 'User already exists' }
      }

      // 2. Create platform user
      console.log('👤 Creating platform user...')
      const hashedPassword = await bcrypt.hash(superadminPassword, 12)

      const platformUser = await tx.platformUser.create({
        data: {
          email: superadminEmail,
          password: hashedPassword,
          name: superadminName,
          isActive: true,
        },
      })

      // 3. Create or get the SuperAdmin law firm (system firm)
      console.log('🏢 Creating system law firm...')
      let systemFirm = await tx.lawFirm.findUnique({
        where: { slug: 'system-admin' },
      })

      if (!systemFirm) {
        systemFirm = await tx.lawFirm.create({
          data: {
            name: 'System Administration',
            slug: 'system-admin',
            domain: 'system.lawfirm.com',
            plan: 'ENTERPRISE',
            isActive: true,
            settings: {
              timezone: 'UTC',
              dateFormat: 'MM/dd/yyyy',
              currency: 'USD',
              features: {
                clientPortal: true,
                documentSharing: true,
                calendarIntegration: true,
                emailNotifications: true,
                systemAccess: true,
              },
            },
          },
        })
      }

      // 4. Create superadmin role if it doesn't exist
      console.log('🔐 Creating superadmin role...')
      let superAdminRole = await tx.role.findFirst({
        where: {
          lawFirmId: systemFirm.id,
          name: 'Super Administrator',
        },
      })

      if (!superAdminRole) {
        superAdminRole = await tx.role.create({
          data: {
            lawFirmId: systemFirm.id,
            name: 'Super Administrator',
            description:
              'System super administrator with global access to all law firms',
            permissions: SUPERADMIN_PERMISSIONS,
            isSystem: true,
          },
        })
      }

      // 5. Create user in the system firm
      console.log('👥 Creating user profile...')
      const user = await tx.user.create({
        data: {
          lawFirmId: systemFirm.id,
          platformUserId: platformUser.id,
          isActive: true,
          joinedAt: new Date(),
        },
      })

      // 6. Assign superadmin role
      console.log('🎯 Assigning superadmin role...')
      await tx.userRole.create({
        data: {
          lawFirmId: systemFirm.id,
          userId: user.id,
          roleId: superAdminRole.id,
          assignedBy: user.id, // Self-assigned during setup
        },
      })

      return {
        platformUser,
        systemFirm,
        user,
        superAdminRole,
        message: 'Created successfully',
      }
    })

    if (result.message === 'User already exists') {
      console.log('✅ Superadmin setup completed (already existed)')
      return
    }

    console.log('✅ Superadmin creation completed successfully!')
    console.log(`📧 Email: ${superadminEmail}`)
    console.log(`🔑 Password: ${superadminPassword}`)
    console.log(`🆔 User ID: ${result.user.id}`)
    console.log(`🏢 System Firm ID: ${result.systemFirm.id}`)
    console.log(`🎯 Role: ${result.superAdminRole.name}`)
    console.log(
      `🔒 Permissions: ${SUPERADMIN_PERMISSIONS.length} total permissions`
    )

    console.log('\n🚨 IMPORTANT SECURITY NOTES:')
    console.log('1. Change the default password immediately after first login')
    console.log('2. This user has access to ALL law firms in the system')
    console.log('3. Use this account only for system administration')
    console.log('4. Consider enabling 2FA for this account')
  } catch (error) {
    console.error('⚠️ Error creating superadmin:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help')) {
    console.log(`
🔧 Superadmin Creation Script

This script creates a system superadmin user with the following credentials:
  Email: superadmin@lawfirm.com
  Password: superadmin123

Usage:
  npm run create-superadmin

Or directly:
  node scripts/create-superadmin.js

The superadmin will have:
- Access to all law firms in the system
- All possible permissions
- Ability to manage platform users and firms
- System-level administrative access

⚠️ Security Warning:
Change the default password immediately after first login!
`)
    return
  }

  try {
    await createSuperAdmin()
  } catch (error) {
    console.error('⚠️ Failed to create superadmin:', error.message)
    process.exit(1)
  }
}

// Check if this file is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  main()
}

export { createSuperAdmin }
