// Super-Admin API Routes for Law Firm Management
// Purpose: List/create/suspend firms; manage tenants

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/auth-guards'
import { ROLES } from '@/lib/rbac'
import { initializeLawFirm } from '../../../../../scripts/initialize-law-firm'

// GET /api/admin/firms - List all law firms
export const GET = withRole(ROLES.SUPER_ADMIN, async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // active, suspended, all
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (status && status !== 'all') {
      where.isActive = status === 'active'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get firms with counts
    const [firms, totalCount] = await Promise.all([
      prisma.lawFirm.findMany({
        where,
        include: {
          users: {
            select: { id: true, isActive: true },
          },
          cases: {
            select: { id: true, status: true },
          },
          _count: {
            select: {
              users: true,
              cases: true,
              documents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.lawFirm.count({ where }),
    ])

    // Transform data for response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firmsWithStats = firms.map((firm: any) => ({
      id: firm.id,
      name: firm.name,
      slug: firm.slug,
      domain: firm.domain,
      plan: firm.plan,
      isActive: firm.isActive,
      createdAt: firm.createdAt,
      updatedAt: firm.updatedAt,
      stats: {
        totalUsers: firm._count.users,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activeUsers: firm.users.filter((u: any) => u.isActive).length,
        totalCases: firm._count.cases,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activeCases: firm.cases.filter((c: any) => c.status !== 'ARCHIVED')
          .length,
        totalDocuments: firm._count.documents,
      },
    }))

    return NextResponse.json({
      firms: firmsWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching law firms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch law firms' },
      { status: 500 }
    )
  }
})

// POST /api/admin/firms - Create new law firm
export const POST = withRole(
  ROLES.SUPER_ADMIN,
  async (request: NextRequest) => {
    try {
      const body = await request.json()
      const {
        name,
        slug,
        domain,
        plan = 'STARTER',
        ownerEmail,
        ownerPassword,
        ownerFirstName,
        ownerLastName,
      } = body

      // Validate required fields
      if (
        !name ||
        !slug ||
        !ownerEmail ||
        !ownerPassword ||
        !ownerFirstName ||
        !ownerLastName
      ) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(ownerEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          {
            error:
              'Invalid slug format. Use lowercase letters, numbers, and hyphens only.',
          },
          { status: 400 }
        )
      }

      // Check if slug or domain already exists
      const whereConditions = [{ slug }]

      // Only add domain check if domain is provided and not empty
      if (domain && domain.trim()) {
        whereConditions.push({ domain: domain.trim() })
      }

      const existing = await prisma.lawFirm.findFirst({
        where: {
          OR: whereConditions,
        },
      })

      if (existing) {
        const conflictType = existing.slug === slug ? 'slug' : 'domain'
        const conflictValue =
          existing.slug === slug ? existing.slug : existing.domain

        console.log(
          `Conflict detected: ${conflictType} '${conflictValue}' already exists for law firm: ${existing.name}`
        )

        return NextResponse.json(
          {
            error: `The ${conflictType} '${conflictValue}' is already in use by another law firm`,
            conflictType,
            conflictValue,
          },
          { status: 409 }
        )
      }

      // Create law firm using the initialization script
      const result = await initializeLawFirm({
        name,
        slug,
        domain,
        plan,
        ownerEmail,
        ownerPassword,
        ownerFirstName,
        ownerLastName,
      })

      return NextResponse.json(
        {
          message: 'Law firm created successfully',
          lawFirm: {
            id: result.lawFirm.id,
            name: result.lawFirm.name,
            slug: result.lawFirm.slug,
            domain: result.lawFirm.domain,
            plan: result.lawFirm.plan,
            isActive: result.lawFirm.isActive,
          },
          owner: {
            id: result.user.id,
            email: result.platformUser.email,
            name: result.platformUser.name,
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Error creating law firm:', error)
      return NextResponse.json(
        { error: 'Failed to create law firm' },
        { status: 500 }
      )
    }
  }
)
