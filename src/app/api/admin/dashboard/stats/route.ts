// Admin Dashboard Stats API
// Purpose: Provide platform-wide statistics for super admin dashboard

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const user = session.user as { role?: string }
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get platform statistics
    const [
      totalLawFirms,
      activeLawFirms,
      suspendedLawFirms,
      totalUsers,
      activeUsers,
      totalCases,
      totalDocuments,
      recentSignups,
    ] = await Promise.all([
      // Total law firms
      prisma.lawFirm.count(),

      // Active law firms
      prisma.lawFirm.count({
        where: { isActive: true },
      }),

      // Suspended law firms
      prisma.lawFirm.count({
        where: { isActive: false },
      }),

      // Total users
      prisma.user.count(),

      // Active users
      prisma.user.count({
        where: { isActive: true },
      }),

      // Total cases (placeholder - will be implemented when cases are added)
      Promise.resolve(0),

      // Total documents (placeholder - will be implemented when documents are added)
      Promise.resolve(0),

      // Recent signups (last 30 days)
      prisma.lawFirm.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    // Mock storage usage for now
    const storageUsage = {
      used: 1024 * 1024 * 1024 * 2.5, // 2.5 GB
      total: 1024 * 1024 * 1024 * 100, // 100 GB
      percentage: 2.5,
    }

    const stats = {
      totalLawFirms,
      activeLawFirms,
      suspendedLawFirms,
      totalUsers,
      activeUsers,
      totalCases,
      totalDocuments,
      recentSignups,
      storageUsage,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
