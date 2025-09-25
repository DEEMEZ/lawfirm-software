// Simple Super Admin Creation Script using raw PostgreSQL client
// Purpose: Create a superadmin user with global system access

import { Client } from 'pg'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

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

// Generate CUID-like ID
function generateId() {
  return (
    'cl' +
    randomBytes(12).toString('base64').replace(/[+/]/g, '').substring(0, 10)
  )
}

async function createSuperAdmin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'lawfirm_db',
    user: 'postgres',
    password: 'Ali.rayyan001',
  })

  const superadminEmail = 'superadmin@lawfirm.com'
  const superadminPassword = 'superadmin123'
  const superadminName = 'Super Administrator'

  console.log('🔧 Creating superadmin user...')

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Database connected successfully!')

    // Start transaction
    await client.query('BEGIN')

    // 1. Check if superadmin already exists
    const existingUserResult = await client.query(
      'SELECT id FROM platform_users WHERE email = $1',
      [superadminEmail]
    )

    if (existingUserResult.rows.length > 0) {
      console.log('⚠️ Superadmin user already exists. Skipping creation.')
      await client.query('ROLLBACK')
      return
    }

    // 2. Create platform user
    console.log('👤 Creating platform user...')
    const hashedPassword = await bcrypt.hash(superadminPassword, 12)
    const platformUserId = generateId()

    await client.query(
      `INSERT INTO platform_users (id, email, password, name, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
      [platformUserId, superadminEmail, hashedPassword, superadminName]
    )

    // 3. Create or get the system law firm
    console.log('🏢 Creating system law firm...')
    let systemFirmResult = await client.query(
      'SELECT id FROM law_firms WHERE slug = $1',
      ['system-admin']
    )

    let systemFirmId
    if (systemFirmResult.rows.length === 0) {
      systemFirmId = generateId()
      await client.query(
        `INSERT INTO law_firms (id, name, slug, domain, plan, "isActive", settings, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, true, $6, NOW(), NOW())`,
        [
          systemFirmId,
          'System Administration',
          'system-admin',
          'system.lawfirm.com',
          'ENTERPRISE',
          JSON.stringify({
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
          }),
        ]
      )
    } else {
      systemFirmId = systemFirmResult.rows[0].id
    }

    // 4. Create superadmin role if it doesn't exist
    console.log('🔐 Creating superadmin role...')
    let roleResult = await client.query(
      'SELECT id FROM roles WHERE law_firm_id = $1 AND name = $2',
      [systemFirmId, 'Super Administrator']
    )

    let roleId
    if (roleResult.rows.length === 0) {
      roleId = generateId()
      await client.query(
        `INSERT INTO roles (id, law_firm_id, name, description, permissions, "isSystem", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
        [
          roleId,
          systemFirmId,
          'Super Administrator',
          'System super administrator with global access to all law firms',
          JSON.stringify(SUPERADMIN_PERMISSIONS),
        ]
      )
    } else {
      roleId = roleResult.rows[0].id
    }

    // 5. Create user in the system firm
    console.log('👥 Creating user profile...')
    const userId = generateId()
    await client.query(
      `INSERT INTO users (id, law_firm_id, platform_user_id, "isActive", "invitedAt", "joinedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, NOW(), NOW(), NOW(), NOW())`,
      [userId, systemFirmId, platformUserId]
    )

    // 6. Assign superadmin role
    console.log('🎯 Assigning superadmin role...')
    const userRoleId = generateId()
    await client.query(
      `INSERT INTO user_roles (id, law_firm_id, user_id, role_id, "assignedAt", assigned_by)
       VALUES ($1, $2, $3, $4, NOW(), $5)`,
      [userRoleId, systemFirmId, userId, roleId, userId]
    )

    // Commit transaction
    await client.query('COMMIT')

    console.log('✅ Superadmin creation completed successfully!')
    console.log(`📧 Email: ${superadminEmail}`)
    console.log(`🔑 Password: ${superadminPassword}`)
    console.log(`🆔 Platform User ID: ${platformUserId}`)
    console.log(`👤 User ID: ${userId}`)
    console.log(`🏢 System Firm ID: ${systemFirmId}`)
    console.log(`🎯 Role ID: ${roleId}`)
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
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
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
  node scripts/create-superadmin-simple.js

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
