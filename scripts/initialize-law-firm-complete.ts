// Complete Law Firm Initialization (No Transactions - Vercel Compatible)
// Purpose: Full firm setup without transactions for Vercel compatibility

import { randomUUID } from 'crypto'
import { prisma } from '../src/lib/prisma'
import { hashPassword } from '../src/lib/auth'
import {
  sendLawFirmCreatedEmail,
  LawFirmCreatedEmailVariables,
} from '../src/lib/email'

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

export async function initializeLawFirmComplete(
  params: InitializeLawFirmParams
) {
  console.log(`🏢 Initializing law firm: ${params.name}`)

  try {
    // 1. Create the law firm
    console.log('🏗️ Creating law firm...')
    const lawFirm = await prisma.law_firms.create({
      data: {
        id: randomUUID(),
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
        updatedAt: new Date(),
      },
    })

    // 2. Create default roles
    console.log('👥 Creating default roles...')
    const roles = []

    const defaultRoles = [
      {
        name: 'Owner',
        description: 'Law firm owner with full access',
        permissions: ['*'],
      },
      {
        name: 'Senior Lawyer',
        description: 'Senior lawyer with management capabilities',
        permissions: ['cases.manage', 'clients.manage'],
      },
      {
        name: 'Junior Lawyer',
        description: 'Junior lawyer with basic case access',
        permissions: ['cases.read', 'clients.read'],
      },
      {
        name: 'Assistant',
        description: 'Legal assistant with administrative access',
        permissions: ['cases.read', 'documents.manage'],
      },
      {
        name: 'Secretary',
        description: 'Secretary with basic administrative access',
        permissions: ['documents.read'],
      },
      {
        name: 'Client',
        description: 'Client with limited read-only access',
        permissions: ['documents.read'],
      },
    ]

    for (const roleData of defaultRoles) {
      const role = await prisma.roles.create({
        data: {
          id: randomUUID(),
          law_firm_id: lawFirm.id,
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          isSystem: true,
          updatedAt: new Date(),
        },
      })
      roles.push(role)
      console.log(`  ✅ Created role: ${roleData.name}`)
    }

    // 3. Create platform user (if doesn't exist)
    console.log('🔐 Creating platform user...')
    const hashedPasswordValue = await hashPassword(params.ownerPassword)

    let platformUser = await prisma.platform_users.findUnique({
      where: { email: params.ownerEmail },
    })

    if (!platformUser) {
      platformUser = await prisma.platform_users.create({
        data: {
          id: randomUUID(),
          email: params.ownerEmail,
          password: hashedPasswordValue,
          name: `${params.ownerFirstName} ${params.ownerLastName}`,
          isActive: true,
          updatedAt: new Date(),
        },
      })
    }

    // 4. Create firm user and assign owner role
    console.log('👤 Creating owner user...')
    const user = await prisma.users.create({
      data: {
        id: randomUUID(),
        law_firm_id: lawFirm.id,
        platform_user_id: platformUser.id,
        isActive: true,
        joinedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // 5. Assign owner role to user
    const ownerRole = roles.find(r => r.name === 'Owner')
    if (ownerRole) {
      await prisma.user_roles.create({
        data: {
          id: randomUUID(),
          law_firm_id: lawFirm.id,
          user_id: user.id,
          role_id: ownerRole.id,
          assigned_by: user.id, // Self-assigned during setup
        },
      })
    }

    console.log('✅ Law firm initialization completed successfully!')
    console.log(`📧 Owner: ${params.ownerEmail}`)
    console.log(`🆔 Law Firm ID: ${lawFirm.id}`)
    console.log(`🔗 Slug: ${lawFirm.slug}`)

    // Send welcome email to the firm owner
    try {
      console.log('📧 Sending welcome email to law firm owner...')

      const emailVariables: LawFirmCreatedEmailVariables = {
        ownerFirstName: params.ownerFirstName,
        ownerLastName: params.ownerLastName,
        ownerEmail: params.ownerEmail,
        ownerPassword: params.ownerPassword,
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

    return {
      lawFirm,
      platformUser,
      user,
      roles,
      ownerRole,
    }
  } catch (error) {
    console.error('⚠️ Error initializing law firm:', error)
    throw error
  }
}
