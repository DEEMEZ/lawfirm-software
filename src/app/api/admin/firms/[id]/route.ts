// Super-Admin API Routes for Individual Law Firm Management
// Purpose: Get/update/suspend specific firms

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/auth-guards'
import { ROLES } from '@/lib/rbac'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/firms/[id] - Get specific law firm details
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withRole(ROLES.SUPER_ADMIN, async () => {
    try {
      const { id } = await params
      const firm = await prisma.lawFirm.findUnique({
        where: { id },
        include: {
          users: {
            include: {
              platformUser: {
                select: {
                  email: true,
                  name: true,
                },
              },
              userRoles: {
                include: {
                  role: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          cases: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              users: true,
              cases: true,
              documents: true,
            },
          },
        },
      })

      if (!firm) {
        return NextResponse.json(
          { error: 'Law firm not found' },
          { status: 404 }
        )
      }

      // Transform user data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const users = firm.users.map((user: any) => ({
        id: user.id,
        email: user.platformUser.email,
        name: user.platformUser.name,
        isActive: user.isActive,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        roles: user.userRoles.map((ur: any) => ur.role.name),
        joinedAt: user.joinedAt,
      }))

      return NextResponse.json({
        id: firm.id,
        name: firm.name,
        slug: firm.slug,
        domain: firm.domain,
        plan: firm.plan,
        isActive: firm.isActive,
        settings: firm.settings,
        createdAt: firm.createdAt,
        updatedAt: firm.updatedAt,
        users,
        recentCases: firm.cases,
        stats: {
          totalUsers: firm._count.users,
          totalCases: firm._count.cases,
          totalDocuments: firm._count.documents,
        },
      })
    } catch (error) {
      console.error('Error fetching law firm:', error)
      return NextResponse.json(
        { error: 'Failed to fetch law firm' },
        { status: 500 }
      )
    }
  })(request)
}

// PATCH /api/admin/firms/[id] - Update law firm
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withRole(ROLES.SUPER_ADMIN, async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const { name, domain, plan, isActive, settings } = body

      // Build update data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (domain !== undefined) updateData.domain = domain
      if (plan !== undefined) updateData.plan = plan
      if (isActive !== undefined) updateData.isActive = isActive
      if (settings !== undefined) updateData.settings = settings

      const firm = await prisma.lawFirm.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({
        message: 'Law firm updated successfully',
        lawFirm: firm,
      })
    } catch (error) {
      console.error('Error updating law firm:', error)
      return NextResponse.json(
        { error: 'Failed to update law firm' },
        { status: 500 }
      )
    }
  })(request)
}

// DELETE /api/admin/firms/[id] - Suspend/deactivate law firm
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withRole(ROLES.SUPER_ADMIN, async () => {
    try {
      const { id } = await params
      // Don't actually delete, just deactivate
      const firm = await prisma.lawFirm.update({
        where: { id },
        data: { isActive: false },
      })

      return NextResponse.json({
        message: 'Law firm suspended successfully',
        lawFirm: firm,
      })
    } catch (error) {
      console.error('Error suspending law firm:', error)
      return NextResponse.json(
        { error: 'Failed to suspend law firm' },
        { status: 500 }
      )
    }
  })(request)
}
