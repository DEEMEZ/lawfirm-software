// RBAC Constants & Guards
// Purpose: Define roles and permissions constants with server-side guards and UI route guards

// Role definitions - hierarchy based (higher level = more permissions)
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  SENIOR_LAWYER: 'senior_lawyer',
  JUNIOR_LAWYER: 'junior_lawyer',
  ASSISTANT: 'assistant',
  SECRETARY: 'secretary',
  CLIENT: 'client'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// Role hierarchy levels (for permission checking)
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 1000, // Platform level
  [ROLES.OWNER]: 100,        // Firm owner
  [ROLES.SENIOR_LAWYER]: 80,
  [ROLES.JUNIOR_LAWYER]: 60,
  [ROLES.ASSISTANT]: 40,
  [ROLES.SECRETARY]: 30,
  [ROLES.CLIENT]: 10
}

// Permission categories
export const PERMISSION_CATEGORIES = {
  PLATFORM: 'platform',
  USERS: 'users',
  CASES: 'cases',
  DOCUMENTS: 'documents',
  CALENDAR: 'calendar',
  TASKS: 'tasks',
  ADMIN: 'admin'
} as const

// Detailed permissions
export const PERMISSIONS = {
  // Platform-level permissions (super admin only)
  PLATFORM: {
    MANAGE_LAW_FIRMS: 'platform.law_firms.manage',
    VIEW_ANALYTICS: 'platform.analytics.view',
    MANAGE_BILLING: 'platform.billing.manage',
    SUPPORT_ACCESS: 'platform.support.access'
  },

  // User management permissions
  USERS: {
    VIEW: 'users.view',
    CREATE: 'users.create',
    EDIT: 'users.edit',
    DELETE: 'users.delete',
    MANAGE_ROLES: 'users.manage_roles'
  },

  // Case management permissions
  CASES: {
    VIEW: 'cases.view',
    VIEW_ALL: 'cases.view_all',
    CREATE: 'cases.create',
    EDIT: 'cases.edit',
    DELETE: 'cases.delete',
    ASSIGN: 'cases.assign'
  },

  // Document management permissions
  DOCUMENTS: {
    VIEW: 'documents.view',
    UPLOAD: 'documents.upload',
    EDIT: 'documents.edit',
    DELETE: 'documents.delete',
    MANAGE_PERMISSIONS: 'documents.manage_permissions'
  },

  // Calendar permissions
  CALENDAR: {
    VIEW: 'calendar.view',
    VIEW_ALL: 'calendar.view_all',
    CREATE: 'calendar.create',
    EDIT: 'calendar.edit',
    DELETE: 'calendar.delete'
  },

  // Task management permissions
  TASKS: {
    VIEW: 'tasks.view',
    CREATE: 'tasks.create',
    EDIT: 'tasks.edit',
    DELETE: 'tasks.delete',
    ASSIGN: 'tasks.assign'
  },

  // Administrative permissions
  ADMIN: {
    FIRM_SETTINGS: 'admin.firm_settings',
    WORKSPACES: 'admin.workspaces',
    AUDIT_LOGS: 'admin.audit_logs'
  }
} as const

// Role permission mappings
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [ROLES.SUPER_ADMIN]: [
    // Platform permissions
    PERMISSIONS.PLATFORM.MANAGE_LAW_FIRMS,
    PERMISSIONS.PLATFORM.VIEW_ANALYTICS,
    PERMISSIONS.PLATFORM.MANAGE_BILLING,
    PERMISSIONS.PLATFORM.SUPPORT_ACCESS,
    // All law firm permissions
    ...Object.values(PERMISSIONS.USERS),
    ...Object.values(PERMISSIONS.CASES),
    ...Object.values(PERMISSIONS.DOCUMENTS),
    ...Object.values(PERMISSIONS.CALENDAR),
    ...Object.values(PERMISSIONS.TASKS),
    ...Object.values(PERMISSIONS.ADMIN)
  ],

  [ROLES.OWNER]: [
    // Full firm access
    ...Object.values(PERMISSIONS.USERS),
    ...Object.values(PERMISSIONS.CASES),
    ...Object.values(PERMISSIONS.DOCUMENTS),
    ...Object.values(PERMISSIONS.CALENDAR),
    ...Object.values(PERMISSIONS.TASKS),
    ...Object.values(PERMISSIONS.ADMIN)
  ],

  [ROLES.SENIOR_LAWYER]: [
    PERMISSIONS.CASES.VIEW_ALL,
    PERMISSIONS.CASES.CREATE,
    PERMISSIONS.CASES.EDIT,
    PERMISSIONS.CASES.ASSIGN,
    PERMISSIONS.DOCUMENTS.VIEW,
    PERMISSIONS.DOCUMENTS.UPLOAD,
    PERMISSIONS.DOCUMENTS.EDIT,
    PERMISSIONS.CALENDAR.VIEW_ALL,
    PERMISSIONS.CALENDAR.CREATE,
    PERMISSIONS.CALENDAR.EDIT,
    PERMISSIONS.TASKS.VIEW,
    PERMISSIONS.TASKS.CREATE,
    PERMISSIONS.TASKS.EDIT,
    PERMISSIONS.TASKS.ASSIGN,
    PERMISSIONS.USERS.VIEW
  ],

  [ROLES.JUNIOR_LAWYER]: [
    PERMISSIONS.CASES.VIEW,
    PERMISSIONS.CASES.EDIT,
    PERMISSIONS.DOCUMENTS.VIEW,
    PERMISSIONS.DOCUMENTS.UPLOAD,
    PERMISSIONS.DOCUMENTS.EDIT,
    PERMISSIONS.CALENDAR.VIEW,
    PERMISSIONS.CALENDAR.CREATE,
    PERMISSIONS.CALENDAR.EDIT,
    PERMISSIONS.TASKS.VIEW,
    PERMISSIONS.TASKS.CREATE,
    PERMISSIONS.TASKS.EDIT
  ],

  [ROLES.ASSISTANT]: [
    PERMISSIONS.CASES.VIEW,
    PERMISSIONS.DOCUMENTS.VIEW,
    PERMISSIONS.DOCUMENTS.UPLOAD,
    PERMISSIONS.CALENDAR.VIEW,
    PERMISSIONS.CALENDAR.CREATE,
    PERMISSIONS.CALENDAR.EDIT,
    PERMISSIONS.TASKS.VIEW,
    PERMISSIONS.TASKS.EDIT
  ],

  [ROLES.SECRETARY]: [
    PERMISSIONS.CASES.VIEW,
    PERMISSIONS.DOCUMENTS.VIEW,
    PERMISSIONS.CALENDAR.VIEW,
    PERMISSIONS.CALENDAR.CREATE,
    PERMISSIONS.TASKS.VIEW
  ],

  [ROLES.CLIENT]: [
    PERMISSIONS.CASES.VIEW,
    PERMISSIONS.DOCUMENTS.VIEW,
    PERMISSIONS.CALENDAR.VIEW
  ]
}

// User context interface
export interface UserContext {
  id: string
  lawFirmId: string
  role: Role
  permissions: string[]
  isActive: boolean
}

// Check if user has specific permission
export function hasPermission(userContext: UserContext, permission: string): boolean {
  if (!userContext.isActive) return false
  return userContext.permissions.includes(permission)
}

// Check if user has any of the specified permissions
export function hasAnyPermission(userContext: UserContext, permissions: string[]): boolean {
  if (!userContext.isActive) return false
  return permissions.some(permission => userContext.permissions.includes(permission))
}

// Check if user has all specified permissions
export function hasAllPermissions(userContext: UserContext, permissions: string[]): boolean {
  if (!userContext.isActive) return false
  return permissions.every(permission => userContext.permissions.includes(permission))
}

// Check if user has role or higher
export function hasRoleOrHigher(userContext: UserContext, requiredRole: Role): boolean {
  if (!userContext.isActive) return false
  const userLevel = ROLE_HIERARCHY[userContext.role]
  const requiredLevel = ROLE_HIERARCHY[requiredRole]
  return userLevel >= requiredLevel
}

// Check if user can access resource (basic ownership check)
export function canAccessResource(
  userContext: UserContext,
  resourceOwnerId: string,
  resourceLawFirmId: string
): boolean {
  if (!userContext.isActive) return false

  // Super admin can access everything
  if (userContext.role === ROLES.SUPER_ADMIN) return true

  // Must be same law firm
  if (userContext.lawFirmId !== resourceLawFirmId) return false

  // Owner can access everything in their firm
  if (userContext.role === ROLES.OWNER) return true

  // Users can access their own resources
  if (userContext.id === resourceOwnerId) return true

  // Senior lawyers can access resources within their firm
  if (userContext.role === ROLES.SENIOR_LAWYER) return true

  return false
}

// Authorization error class
export class AuthorizationError extends Error {
  constructor(message: string, public permission?: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

// Server-side authorization guard
export function requirePermission(userContext: UserContext, permission: string): void {
  if (!hasPermission(userContext, permission)) {
    throw new AuthorizationError(
      `Access denied. Required permission: ${permission}`,
      permission
    )
  }
}

// Server-side role guard
export function requireRole(userContext: UserContext, requiredRole: Role): void {
  if (!hasRoleOrHigher(userContext, requiredRole)) {
    throw new AuthorizationError(
      `Access denied. Required role: ${requiredRole} or higher`
    )
  }
}

// Multiple permission guard
export function requireAnyPermission(userContext: UserContext, permissions: string[]): void {
  if (!hasAnyPermission(userContext, permissions)) {
    throw new AuthorizationError(
      `Access denied. Required permissions: ${permissions.join(' OR ')}`
    )
  }
}

// UI Route protection helper
export function getAuthorizedRoutes(userContext: UserContext): string[] {
  const routes: string[] = ['/dashboard']

  if (hasPermission(userContext, PERMISSIONS.CASES.VIEW)) {
    routes.push('/cases')
  }

  if (hasPermission(userContext, PERMISSIONS.DOCUMENTS.VIEW)) {
    routes.push('/documents')
  }

  if (hasPermission(userContext, PERMISSIONS.CALENDAR.VIEW)) {
    routes.push('/calendar')
  }

  if (hasPermission(userContext, PERMISSIONS.TASKS.VIEW)) {
    routes.push('/tasks')
  }

  if (hasPermission(userContext, PERMISSIONS.USERS.VIEW)) {
    routes.push('/users')
  }

  if (hasPermission(userContext, PERMISSIONS.ADMIN.FIRM_SETTINGS)) {
    routes.push('/admin')
  }

  if (userContext.role === ROLES.SUPER_ADMIN) {
    routes.push('/platform-admin')
  }

  return routes
}

// Navigation items based on permissions
export interface NavItem {
  label: string
  href: string
  permission?: string
  role?: Role
}

export function getAuthorizedNavItems(userContext: UserContext): NavItem[] {
  const allNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Cases', href: '/cases', permission: PERMISSIONS.CASES.VIEW },
    { label: 'Documents', href: '/documents', permission: PERMISSIONS.DOCUMENTS.VIEW },
    { label: 'Calendar', href: '/calendar', permission: PERMISSIONS.CALENDAR.VIEW },
    { label: 'Tasks', href: '/tasks', permission: PERMISSIONS.TASKS.VIEW },
    { label: 'Users', href: '/users', permission: PERMISSIONS.USERS.VIEW },
    { label: 'Admin', href: '/admin', permission: PERMISSIONS.ADMIN.FIRM_SETTINGS },
    { label: 'Platform Admin', href: '/platform-admin', role: ROLES.SUPER_ADMIN }
  ]

  return allNavItems.filter(item => {
    if (item.permission && !hasPermission(userContext, item.permission)) {
      return false
    }
    if (item.role && !hasRoleOrHigher(userContext, item.role)) {
      return false
    }
    return true
  })
}

// Test matrix for role × action validation
export const ROLE_ACTION_TEST_MATRIX = {
  [ROLES.SUPER_ADMIN]: {
    canCreateLawFirm: true,
    canViewAllFirms: true,
    canManageBilling: true,
    canImpersonate: true,
    canCreateUser: true,
    canDeleteUser: true,
    canCreateCase: true,
    canDeleteCase: true,
    canUploadDocument: true,
    canDeleteDocument: true,
    canViewAllCalendars: true,
    canAssignTasks: true
  },
  [ROLES.OWNER]: {
    canCreateLawFirm: false,
    canViewAllFirms: false,
    canManageBilling: false,
    canImpersonate: false,
    canCreateUser: true,
    canDeleteUser: true,
    canCreateCase: true,
    canDeleteCase: true,
    canUploadDocument: true,
    canDeleteDocument: true,
    canViewAllCalendars: true,
    canAssignTasks: true
  },
  [ROLES.SENIOR_LAWYER]: {
    canCreateLawFirm: false,
    canViewAllFirms: false,
    canManageBilling: false,
    canImpersonate: false,
    canCreateUser: false,
    canDeleteUser: false,
    canCreateCase: true,
    canDeleteCase: false,
    canUploadDocument: true,
    canDeleteDocument: false,
    canViewAllCalendars: true,
    canAssignTasks: true
  },
  [ROLES.JUNIOR_LAWYER]: {
    canCreateLawFirm: false,
    canViewAllFirms: false,
    canManageBilling: false,
    canImpersonate: false,
    canCreateUser: false,
    canDeleteUser: false,
    canCreateCase: false,
    canDeleteCase: false,
    canUploadDocument: true,
    canDeleteDocument: false,
    canViewAllCalendars: false,
    canAssignTasks: false
  },
  [ROLES.ASSISTANT]: {
    canCreateLawFirm: false,
    canViewAllFirms: false,
    canManageBilling: false,
    canImpersonate: false,
    canCreateUser: false,
    canDeleteUser: false,
    canCreateCase: false,
    canDeleteCase: false,
    canUploadDocument: true,
    canDeleteDocument: false,
    canViewAllCalendars: false,
    canAssignTasks: false
  },
  [ROLES.SECRETARY]: {
    canCreateLawFirm: false,
    canViewAllFirms: false,
    canManageBilling: false,
    canImpersonate: false,
    canCreateUser: false,
    canDeleteUser: false,
    canCreateCase: false,
    canDeleteCase: false,
    canUploadDocument: false,
    canDeleteDocument: false,
    canViewAllCalendars: false,
    canAssignTasks: false
  },
  [ROLES.CLIENT]: {
    canCreateLawFirm: false,
    canViewAllFirms: false,
    canManageBilling: false,
    canImpersonate: false,
    canCreateUser: false,
    canDeleteUser: false,
    canCreateCase: false,
    canDeleteCase: false,
    canUploadDocument: false,
    canDeleteDocument: false,
    canViewAllCalendars: false,
    canAssignTasks: false
  }
}