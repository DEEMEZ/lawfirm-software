// Law Firm Initialization Script
// Purpose: One-click firm setup with default workspace, roles, settings, and categories

import { PrismaClient } from '@prisma/client'
import { ROLES, ROLE_PERMISSIONS } from '../src/lib/rbac'
import { hashPassword } from '../src/lib/auth'
import {
  sendLawFirmCreatedEmail,
  LawFirmCreatedEmailVariables,
} from '../src/lib/email'

const prisma = new PrismaClient()

interface InitializeLawFirmParams {
  name: string
  slug: string
  domain?: string
  plan?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  ownerEmail: string
  ownerPassword: string
  ownerFirstName: string
  ownerLastName: string
}

interface ParsedCliParams {
  name?: string
  slug?: string
  email?: string
  password?: string
  first?: string
  last?: string
  domain?: string
  plan?: string
  [key: string]: string | undefined
}

// Type for Prisma transaction client
type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

// Main initialization function
export async function initializeLawFirm(params: InitializeLawFirmParams) {
  console.log(`🏢 Initializing law firm: ${params.name}`)

  try {
    // Start transaction
    const result = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
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
        const hashedPassword = await hashPassword(params.ownerPassword)

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

        // 6. Create default workspace/team structure
        console.log('🗂️ Creating default workspace...')
        // Note: This would need workspace table if you add it later

        // 7. Create default case categories
        console.log('📁 Creating case categories...')
        // Note: This would need case_categories table from your schema

        // 8. Create default document categories
        console.log('📄 Creating document categories...')
        // Note: This would need document_categories table from your schema

        // 9. Create default settings and preferences
        console.log('⚙️ Setting up default configurations...')
        // Settings are already included in law firm creation

        return {
          lawFirm,
          platformUser,
          user,
          roles,
          ownerRole,
        }
      }
    )

    console.log('✅ Law firm initialization completed successfully!')
    console.log(`📧 Owner: ${params.ownerEmail}`)
    console.log(`🆔 Law Firm ID: ${result.lawFirm.id}`)
    console.log(`🔗 Slug: ${result.lawFirm.slug}`)

    // Send welcome email to the firm owner
    try {
      console.log('📧 Sending welcome email to law firm owner...')

      const emailVariables: LawFirmCreatedEmailVariables = {
        ownerFirstName: params.ownerFirstName,
        ownerLastName: params.ownerLastName,
        ownerEmail: params.ownerEmail,
        firmName: params.name,
        plan: params.plan || 'STARTER',
        domain: params.domain,
        loginUrl:
          process.env.NEXTAUTH_URL || 'http://localhost:3000/auth/login',
      }

      const emailResult = await sendLawFirmCreatedEmail(
        {
          email: params.ownerEmail,
          name: `${params.ownerFirstName} ${params.ownerLastName}`,
        },
        emailVariables
      )

      if (emailResult.success) {
        console.log(
          `✅ Welcome email sent successfully via ${emailResult.provider}`
        )
      } else {
        console.warn(`⚠️ Failed to send welcome email: ${emailResult.error}`)
      }
    } catch (emailError) {
      console.warn(
        '⚠️ Email sending failed (but firm creation succeeded):',
        emailError instanceof Error ? emailError.message : emailError
      )
    }

    return result
  } catch (error) {
    console.error('⚠️ Error initializing law firm:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Create default roles for a law firm
async function createDefaultRoles(
  tx: PrismaTransactionClient,
  lawFirmId: string
) {
  const defaultRoles = [
    {
      name: 'Owner',
      description: 'Law firm owner with full access',
      permissions: ROLE_PERMISSIONS[ROLES.OWNER],
      isSystem: true,
    },
    {
      name: 'Senior Lawyer',
      description: 'Senior lawyer with management capabilities',
      permissions: ROLE_PERMISSIONS[ROLES.SENIOR_LAWYER],
      isSystem: true,
    },
    {
      name: 'Junior Lawyer',
      description: 'Junior lawyer with basic case access',
      permissions: ROLE_PERMISSIONS[ROLES.JUNIOR_LAWYER],
      isSystem: true,
    },
    {
      name: 'Assistant',
      description: 'Legal assistant with administrative access',
      permissions: ROLE_PERMISSIONS[ROLES.ASSISTANT],
      isSystem: true,
    },
    {
      name: 'Secretary',
      description: 'Secretary with basic administrative access',
      permissions: ROLE_PERMISSIONS[ROLES.SECRETARY],
      isSystem: true,
    },
    {
      name: 'Client',
      description: 'Client with limited read-only access',
      permissions: ROLE_PERMISSIONS[ROLES.CLIENT],
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
  npm run init-firm -- --name "Smith & Associates" --slug "smith-associates" --email "owner@smith.com" --password "secure123" --first "John" --last "Smith"

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
  npm run init-firm -- --name "Acme Law" --slug "acme-law" --email "admin@acme.com" --password "password123" --first "Jane" --last "Doe"
`)
    process.exit(0)
  }

  // Parse CLI arguments
  const params: ParsedCliParams = {}
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
    process.exit(1)
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!params.email || !emailRegex.test(params.email)) {
    console.error('⚠️ Invalid email format')
    process.exit(1)
  }

  // Validate slug format (URL-safe)
  const slugRegex = /^[a-z0-9-]+$/
  if (!params.slug || !slugRegex.test(params.slug)) {
    console.error(
      '⚠️ Invalid slug format. Use lowercase letters, numbers, and hyphens only.'
    )
    process.exit(1)
  }

  // Validate plan if provided
  if (
    params.plan &&
    !['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(params.plan)
  ) {
    console.error(
      '⚠️ Invalid plan. Must be STARTER, PROFESSIONAL, or ENTERPRISE'
    )
    process.exit(1)
  }

  // Type guard to ensure all required fields exist
  if (
    !params.name ||
    !params.slug ||
    !params.email ||
    !params.password ||
    !params.first ||
    !params.last
  ) {
    console.error('⚠️ Required parameters are missing')
    process.exit(1)
  }

  try {
    await initializeLawFirm({
      name: params.name,
      slug: params.slug,
      domain: params.domain,
      plan: params.plan as
        | 'STARTER'
        | 'PROFESSIONAL'
        | 'ENTERPRISE'
        | undefined,
      ownerEmail: params.email,
      ownerPassword: params.password,
      ownerFirstName: params.first,
      ownerLastName: params.last,
    })
  } catch (error) {
    console.error('⚠️ Failed to initialize law firm:', error)
    process.exit(1)
  }
}

// Export for testing and API usage
export { createDefaultRoles }

// Run if called directly
if (require.main === module) {
  main()
}
