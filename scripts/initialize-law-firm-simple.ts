// Simplified Law Firm Initialization (No Transactions)
// Purpose: Debug version without transactions for Vercel

import { randomUUID } from 'crypto'
import { prisma } from '../src/lib/prisma'

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

export async function initializeLawFirmSimple(params: InitializeLawFirmParams) {
  console.log(`🏢 SIMPLE: Initializing law firm: ${params.name}`)

  try {
    console.log('🔍 SIMPLE: Testing basic prisma.law_firms.create')
    console.log('🔍 SIMPLE: prisma.law_firms exists =', !!prisma.law_firms)
    console.log(
      '🔍 SIMPLE: prisma.law_firms.create exists =',
      !!prisma.law_firms.create
    )

    // 1. Create the law firm (no transaction)
    console.log('🏗️ SIMPLE: Creating law firm directly...')
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
        },
        updatedAt: new Date(),
      },
    })

    console.log('✅ SIMPLE: Law firm created successfully!', lawFirm.id)

    return {
      lawFirm,
      platformUser: {
        id: 'dummy',
        email: params.ownerEmail,
        name: `${params.ownerFirstName} ${params.ownerLastName}`,
      },
      user: { id: 'dummy' },
    }
  } catch (error) {
    console.error('💥 SIMPLE: Error:', error)
    throw error
  }
}
