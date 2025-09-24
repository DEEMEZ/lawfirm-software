// Admin Dashboard Activity API
// Purpose: Provide recent platform activity for super admin dashboard

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

    // Get recent law firm signups (as activities)
    const recentFirms = await prisma.lawFirm.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        isActive: true,
      },
    })

    // Convert to activity format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activities = recentFirms.map((firm: any) => ({
      id: `firm-${firm.id}`,
      type: 'signup' as const,
      message: `New law firm "${firm.name}" signed up`,
      timestamp: firm.createdAt.toISOString(),
      lawFirmName: firm.name,
    }))

    // In the future, you can add more activity types like:
    // - User suspensions/activations
    // - Impersonation events
    // - System alerts
    // These would come from audit logs or other tracking tables

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching dashboard activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
