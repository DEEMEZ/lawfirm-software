// Law Firm Initialization Script (JavaScript version)
// Purpose: One-click firm setup with default workspace, roles, settings, and categories

// Import Prisma client from generated location
let PrismaClient
try {
  // Use dynamic import instead of require
  const prismaModule = await import('@prisma/client')
  PrismaClient = prismaModule.PrismaClient
} catch {
  console.error('⚠️ Prisma client not found. Run "npx prisma generate" first.')
  process.exit(1)
}

let bcrypt
try {
  // Use dynamic import instead of require
  const bcryptModule = await import('bcryptjs')
  bcrypt = bcryptModule.default
} catch {
  console.error(
    '⚠️ bcryptjs not found. It should be installed as a dependency.'
  )
  process.exit(1)
}

const prisma = new PrismaClient()

// Default role permissions (simplified for JS)
const ROLE_PERMISSIONS = {
  owner: [
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
  ],
  senior_lawyer: [
    'cases.view_all',
    'cases.create',
    'cases.edit',
    'cases.assign',
    'documents.view',
    'documents.upload',
    'documents.edit',
    'calendar.view_all',
    'calendar.create',
    'calendar.edit',
    'tasks.view',
    'tasks.create',
    'tasks.edit',
    'tasks.assign',
    'users.view',
  ],
  junior_lawyer: [
    'cases.view',
    'cases.edit',
    'documents.view',
    'documents.upload',
    'documents.edit',
    'calendar.view',
    'calendar.create',
    'calendar.edit',
    'tasks.view',
    'tasks.create',
    'tasks.edit',
  ],
  assistant: [
    'cases.view',
    'documents.view',
    'documents.upload',
    'calendar.view',
    'calendar.create',
    'calendar.edit',
    'tasks.view',
    'tasks.edit',
  ],
  secretary: [
    'cases.view',
    'documents.view',
    'calendar.view',
    'calendar.create',
    'tasks.view',
  ],
  client: ['cases.view', 'documents.view', 'calendar.view'],
}

// Main initialization function
async function initializeLawFirm(params) {
  console.log(`🏢 Initializing law firm: ${params.name}`)

  try {
    // Start transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Create the law firm
      console.log('🏗️ Creating law firm...')
      const lawFirm = await tx.lawFirm.create({
        data: {
          name: params.name,
          slug: params.slug,
          domain: params.domain,
          plan: params.plan || 'STARTER',
          isActive: true,
          settings: {
            timezone: 'UTC',
            dateFormat: 'MM/dd/yyyy',
            currency: 'USD',
            businessHours: {
              monday: { start: '09:00', end: '17:00' },
              tuesday: { start: '09:00', end: '17:00' },
              wednesday: { start: '09:00', end: '17:00' },
              thursday: { start: '09:00', end: '17:00' },
              friday: { start: '09:00', end: '17:00' },
              saturday: { closed: true },
              sunday: { closed: true },
            },
            features: {
              clientPortal: true,
              documentSharing: true,
              calendarIntegration: true,
              emailNotifications: true,
            },
          },
        },
      })

      // 2. Create default roles for the law firm
      console.log('👥 Creating default roles...')
      const roles = await createDefaultRoles(tx, lawFirm.id)

      // 3. Create platform user (if doesn't exist)
      console.log('🔐 Creating platform user...')
      const hashedPassword = await bcrypt.hash(params.ownerPassword, 12)

      let platformUser = await tx.platformUser.findUnique({
        where: { email: params.ownerEmail },
      })

      if (!platformUser) {
        platformUser = await tx.platformUser.create({
          data: {
            email: params.ownerEmail,
            password: hashedPassword,
            name: `${params.ownerFirstName} ${params.ownerLastName}`,
            isActive: true,
          },
        })
      }

      // 4. Create firm user and assign owner role
      console.log('👤 Creating owner user...')
      const user = await tx.user.create({
        data: {
          lawFirmId: lawFirm.id,
          platformUserId: platformUser.id,
          isActive: true,
          joinedAt: new Date(),
        },
      })

      // 5. Assign owner role to user
      const ownerRole = roles.find(r => r.name === 'Owner')
      if (ownerRole) {
        await tx.userRole.create({
          data: {
            lawFirmId: lawFirm.id,
            userId: user.id,
            roleId: ownerRole.id,
            assignedBy: user.id, // Self-assigned during setup
          },
        })
      }

      return {
        lawFirm,
        platformUser,
        user,
        roles,
        ownerRole,
      }
    })

    console.log('✅ Law firm initialization completed successfully!')
    console.log(`📧 Owner: ${params.ownerEmail}`)
    console.log(`🆔 Law Firm ID: ${result.lawFirm.id}`)
    console.log(`🔗 Slug: ${result.lawFirm.slug}`)
    console.log(`👥 Roles created: ${result.roles.length}`)

    return result
  } catch (error) {
    console.error('⚠️ Error initializing law firm:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Create default roles for a law firm
async function createDefaultRoles(tx, lawFirmId) {
  const defaultRoles = [
    {
      name: 'Owner',
      description: 'Law firm owner with full access',
      permissions: ROLE_PERMISSIONS.owner,
      isSystem: true,
    },
    {
      name: 'Senior Lawyer',
      description: 'Senior lawyer with management capabilities',
      permissions: ROLE_PERMISSIONS.senior_lawyer,
      isSystem: true,
    },
    {
      name: 'Junior Lawyer',
      description: 'Junior lawyer with basic case access',
      permissions: ROLE_PERMISSIONS.junior_lawyer,
      isSystem: true,
    },
    {
      name: 'Assistant',
      description: 'Legal assistant with administrative access',
      permissions: ROLE_PERMISSIONS.assistant,
      isSystem: true,
    },
    {
      name: 'Secretary',
      description: 'Secretary with basic administrative access',
      permissions: ROLE_PERMISSIONS.secretary,
      isSystem: true,
    },
    {
      name: 'Client',
      description: 'Client with limited read-only access',
      permissions: ROLE_PERMISSIONS.client,
      isSystem: true,
    },
  ]

  const createdRoles = []
  for (const roleData of defaultRoles) {
    const role = await tx.role.create({
      data: {
        lawFirmId,
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        isSystem: roleData.isSystem,
      },
    })
    createdRoles.push(role)
    console.log(`  ✅ Created role: ${roleData.name}`)
  }

  return createdRoles
}

// CLI interface for the script
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
🏢 Law Firm Initialization Script

Usage:
  node scripts/initialize-law-firm.js --name "Smith & Associates" --slug "smith-associates" --email "owner@smith.com" --password "secure123" --first "John" --last "Smith"

Options:
  --name         Law firm name (required)
  --slug         URL slug for the firm (required)
  --email        Owner email address (required)
  --password     Owner password (required)
  --first        Owner first name (required)
  --last         Owner last name (required)
  --domain       Custom domain (optional)
  --plan         Plan type: STARTER, PROFESSIONAL, ENTERPRISE (default: STARTER)

Example:
  node scripts/initialize-law-firm.js --name "Acme Law" --slug "acme-law" --email "admin@acme.com" --password "password123" --first "Jane" --last "Doe"
`)
    return
  }

  // Parse CLI arguments
  const params = {}
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '')
    const value = args[i + 1]
    params[key] = value
  }

  // Validate required parameters
  const required = ['name', 'slug', 'email', 'password', 'first', 'last']
  const missing = required.filter(key => !params[key])

  if (missing.length > 0) {
    console.error(`⚠️ Missing required parameters: ${missing.join(', ')}`)
    console.log('Use --help for usage information')
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(params.email)) {
    console.error('⚠️ Invalid email format')
    return
  }

  // Validate slug format (URL-safe)
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(params.slug)) {
    console.error(
      '⚠️ Invalid slug format. Use lowercase letters, numbers, and hyphens only.'
    )
    return
  }

  // Validate plan if provided
  if (
    params.plan &&
    !['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(params.plan)
  ) {
    console.error(
      '⚠️ Invalid plan. Must be STARTER, PROFESSIONAL, or ENTERPRISE'
    )
    return
  }

  try {
    await initializeLawFirm({
      name: params.name,
      slug: params.slug,
      domain: params.domain,
      plan: params.plan,
      ownerEmail: params.email,
      ownerPassword: params.password,
      ownerFirstName: params.first,
      ownerLastName: params.last,
    })
  } catch (error) {
    console.error('⚠️ Failed to initialize law firm:', error)
  }
}

// Check if this file is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  main()
}

export { initializeLawFirm, createDefaultRoles }
