// Get Current User Context API
// Purpose: Return current user info with role for authorization

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import {
  getUserWithPermissions,
  getPlatformUserContext,
} from '@/lib/user-context'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if this is a platform user (super admin)
    const platformUserId = (session.user as { platformUserId?: string })
      .platformUserId

    if (platformUserId) {
      // Try to get platform user context first (for super admins)
      const platformUserContext = await getPlatformUserContext(platformUserId)

      if (platformUserContext) {
        return NextResponse.json({
          id: platformUserContext.id,
          email: session.user.email,
          name: session.user.name,
          role: 'super_admin',
          lawFirmId: '',
          permissions: platformUserContext.permissions,
          isPlatformUser: true,
        })
      }

      // If not a platform super admin, get regular user context
      const lawFirmId = (session.user as { lawFirmId?: string }).lawFirmId
      const userId = session.user.id

      if (lawFirmId && userId) {
        const userContext = await getUserWithPermissions(userId, lawFirmId)

        if (userContext) {
          return NextResponse.json({
            id: userContext.id,
            email: session.user.email,
            name: session.user.name,
            role: userContext.role,
            lawFirmId: userContext.lawFirmId,
            permissions: userContext.permissions,
            isPlatformUser: false,
          })
        }
      }
    }

    return NextResponse.json(
      { error: 'User context not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error getting user context:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
