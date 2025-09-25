// User Context and Permission Resolution
// Purpose: Get user context with permissions from database

import { prisma } from './prisma'
import { UserContext, Role, ROLE_PERMISSIONS } from './rbac'

// Get user with their current permissions
export async function getUserWithPermissions(
  userId: string,
  lawFirmId: string
): Promise<UserContext | null> {
  try {
    // Get user with their roles and law firm
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        lawFirmId: lawFirmId,
        isActive: true,
      },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                name: true,
                permissions: true,
              },
            },
          },
        },
        lawFirm: {
          select: {
            isActive: true,
          },
        },
      },
    })

    if (!user || !user.lawFirm?.isActive) {
      return null
    }

    // Get primary role (highest level role)
    const userRoles = user.userRoles
      .map(
        (ur: { role: { name: string } }) =>
          ur.role.name.toLowerCase().replace(/\s+/g, '_') as Role
      )
      .filter(Boolean)

    const primaryRole = getPrimaryRole(userRoles)

    if (!primaryRole) {
      return null
    }

    // Combine permissions from all roles
    const allPermissions = new Set<string>()

    // Add permissions from role definitions
    userRoles.forEach((role: Role) => {
      const rolePermissions = ROLE_PERMISSIONS[role] || []
      rolePermissions.forEach((permission: string) =>
        allPermissions.add(permission)
      )
    })

    // Add custom permissions from database roles
    user.userRoles.forEach((userRole: { role: { permissions?: unknown } }) => {
      const customPermissions = (userRole.role.permissions as string[]) || []
      customPermissions.forEach((permission: string) =>
        allPermissions.add(permission)
      )
    })

    return {
      id: user.id,
      lawFirmId: user.lawFirmId,
      role: primaryRole,
      permissions: Array.from(allPermissions),
      isActive: user.isActive,
    }
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

// Get platform user context (for super admin)
export async function getPlatformUserContext(
  platformUserId: string
): Promise<UserContext | null> {
  try {
    const platformUser = await prisma.platformUser.findFirst({
      where: {
        id: platformUserId,
        isActive: true,
      },
      include: {
        users: true, // Include associated law firm users
      },
    })

    if (!platformUser) {
      return null
    }

    // Only return super admin context if user has NO law firm associations
    if (platformUser.users.length > 0) {
      return null // This user is associated with law firms, not a super admin
    }

    // Platform users with no law firm associations have super admin role
    return {
      id: platformUser.id,
      lawFirmId: '', // Platform users don't belong to a specific law firm
      role: 'super_admin' as Role,
      permissions: ROLE_PERMISSIONS['super_admin'],
      isActive: platformUser.isActive,
    }
  } catch (error) {
    console.error('Error getting platform user context:', error)
    return null
  }
}

// Determine primary role from multiple roles
function getPrimaryRole(roles: Role[]): Role | null {
  if (roles.length === 0) return null
  if (roles.length === 1) return roles[0]

  // Role hierarchy for determining primary role
  const roleOrder: Role[] = [
    'super_admin',
    'owner',
    'senior_lawyer',
    'junior_lawyer',
    'assistant',
    'secretary',
    'client',
  ]

  // Return the highest level role
  for (const role of roleOrder) {
    if (roles.includes(role)) {
      return role
    }
  }

  return roles[0] // Fallback to first role
}

// Check if user can access a specific law firm
export async function canAccessLawFirm(
  userId: string,
  lawFirmId: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        lawFirmId: lawFirmId,
        isActive: true,
      },
      include: {
        lawFirm: {
          select: {
            isActive: true,
          },
        },
      },
    })

    return user?.lawFirm?.isActive === true
  } catch (error) {
    console.error('Error checking law firm access:', error)
    return false
  }
}

// Get user's accessible law firms (for super admin who can access multiple firms)
export async function getUserAccessibleLawFirms(
  userId: string,
  isPlatformUser = false
): Promise<{ id: string; name: string; slug: string }[]> {
  try {
    if (isPlatformUser) {
      // Platform users can access all law firms
      const lawFirms = await prisma.lawFirm.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: { name: 'asc' },
      })
      return lawFirms
    }

    // Regular users can only access their own law firm
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        isActive: true,
      },
      include: {
        lawFirm: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return user?.lawFirm ? [user.lawFirm] : []
  } catch (error) {
    console.error('Error getting accessible law firms:', error)
    return []
  }
}

// Refresh user permissions (call after role changes)
export async function refreshUserPermissions(
  userId: string,
  lawFirmId: string
): Promise<UserContext | null> {
  // Clear any caches here if you implement caching
  return getUserWithPermissions(userId, lawFirmId)
}

// TODO: Workspace functionality will be implemented in future phases
// The following functions are placeholders for workspace management

// Get user's workspace memberships (placeholder)
export async function getUserWorkspaces(): Promise<
  { id: string; name: string; role: string }[]
> {
  // TODO: Implement when workspace tables are added to schema
  console.log(
    'getUserWorkspaces: Not implemented yet - workspace tables not in current schema'
  )
  return []
}

// Check if user has access to specific workspace (placeholder)
export async function canAccessWorkspace(): Promise<boolean> {
  // TODO: Implement when workspace tables are added to schema
  console.log(
    'canAccessWorkspace: Not implemented yet - workspace tables not in current schema'
  )
  return false
}

// Get user's role in specific workspace (placeholder)
export async function getUserWorkspaceRole(): Promise<string | null> {
  // TODO: Implement when workspace tables are added to schema
  console.log(
    'getUserWorkspaceRole: Not implemented yet - workspace tables not in current schema'
  )
  return null
}
