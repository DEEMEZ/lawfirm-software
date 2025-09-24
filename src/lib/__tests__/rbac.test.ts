// RBAC Test Matrix
// Purpose: Test role × action combinations to ensure proper authorization

import {
  ROLES,
  PERMISSIONS,
  ROLE_ACTION_TEST_MATRIX,
  hasPermission,
  hasRoleOrHigher,
  canAccessResource,
  UserContext,
  Role,
} from '../rbac'

// Mock user contexts for testing
const createMockUserContext = (
  role: Role,
  lawFirmId = 'test-firm-1'
): UserContext => ({
  id: `user-${role}`,
  lawFirmId,
  role,
  permissions: [], // Will be set based on role
  isActive: true,
})

// Test permissions for each role
export function testRolePermissions() {
  const testResults: Record<string, Record<string, unknown>> = {}

  Object.values(ROLES).forEach(role => {
    const userContext = createMockUserContext(role)
    testResults[role] = {}

    // Test each action from the test matrix
    const expectedActions = ROLE_ACTION_TEST_MATRIX[role]

    Object.entries(expectedActions).forEach(([action, expected]) => {
      let actual: boolean

      switch (action) {
        case 'canCreateLawFirm':
          actual = hasPermission(
            userContext,
            PERMISSIONS.PLATFORM.MANAGE_LAW_FIRMS
          )
          break
        case 'canViewAllFirms':
          actual = hasPermission(
            userContext,
            PERMISSIONS.PLATFORM.VIEW_ANALYTICS
          )
          break
        case 'canManageBilling':
          actual = hasPermission(
            userContext,
            PERMISSIONS.PLATFORM.MANAGE_BILLING
          )
          break
        case 'canImpersonate':
          actual = hasPermission(
            userContext,
            PERMISSIONS.PLATFORM.SUPPORT_ACCESS
          )
          break
        case 'canCreateUser':
          actual = hasPermission(userContext, PERMISSIONS.USERS.CREATE)
          break
        case 'canDeleteUser':
          actual = hasPermission(userContext, PERMISSIONS.USERS.DELETE)
          break
        case 'canCreateCase':
          actual = hasPermission(userContext, PERMISSIONS.CASES.CREATE)
          break
        case 'canDeleteCase':
          actual = hasPermission(userContext, PERMISSIONS.CASES.DELETE)
          break
        case 'canUploadDocument':
          actual = hasPermission(userContext, PERMISSIONS.DOCUMENTS.UPLOAD)
          break
        case 'canDeleteDocument':
          actual = hasPermission(userContext, PERMISSIONS.DOCUMENTS.DELETE)
          break
        case 'canViewAllCalendars':
          actual = hasPermission(userContext, PERMISSIONS.CALENDAR.VIEW_ALL)
          break
        case 'canAssignTasks':
          actual = hasPermission(userContext, PERMISSIONS.TASKS.ASSIGN)
          break
        default:
          actual = false
      }

      testResults[role][action] = {
        expected,
        actual,
        passed: expected === actual,
      }
    })
  })

  return testResults
}

// Test role hierarchy
export function testRoleHierarchy() {
  const hierarchyTests = [
    { user: ROLES.SUPER_ADMIN, required: ROLES.OWNER, expected: true },
    { user: ROLES.SUPER_ADMIN, required: ROLES.CLIENT, expected: true },
    { user: ROLES.OWNER, required: ROLES.SENIOR_LAWYER, expected: true },
    { user: ROLES.OWNER, required: ROLES.SUPER_ADMIN, expected: false },
    {
      user: ROLES.SENIOR_LAWYER,
      required: ROLES.JUNIOR_LAWYER,
      expected: true,
    },
    {
      user: ROLES.JUNIOR_LAWYER,
      required: ROLES.SENIOR_LAWYER,
      expected: false,
    },
    { user: ROLES.ASSISTANT, required: ROLES.CLIENT, expected: true },
    { user: ROLES.CLIENT, required: ROLES.ASSISTANT, expected: false },
  ]

  return hierarchyTests.map(test => {
    const userContext = createMockUserContext(test.user)
    const actual = hasRoleOrHigher(userContext, test.required)

    return {
      ...test,
      actual,
      passed: test.expected === actual,
    }
  })
}

// Test resource access
export function testResourceAccess() {
  const firm1 = 'firm-1'
  const firm2 = 'firm-2'
  const user1 = 'user-1'
  const user2 = 'user-2'

  const accessTests = [
    // Super admin can access everything
    {
      user: createMockUserContext(ROLES.SUPER_ADMIN, firm1),
      resource: { ownerId: user2, lawFirmId: firm2 },
      expected: true,
      description: 'Super admin accesses cross-firm resource',
    },
    // Owner can access anything in their firm
    {
      user: createMockUserContext(ROLES.OWNER, firm1),
      resource: { ownerId: user2, lawFirmId: firm1 },
      expected: true,
      description: 'Owner accesses resource in same firm',
    },
    // Owner cannot access other firm's resources
    {
      user: createMockUserContext(ROLES.OWNER, firm1),
      resource: { ownerId: user2, lawFirmId: firm2 },
      expected: false,
      description: 'Owner cannot access cross-firm resource',
    },
    // User can access their own resource
    {
      user: { ...createMockUserContext(ROLES.JUNIOR_LAWYER, firm1), id: user1 },
      resource: { ownerId: user1, lawFirmId: firm1 },
      expected: true,
      description: 'User accesses own resource',
    },
    // User cannot access other user's resource (unless senior lawyer)
    {
      user: createMockUserContext(ROLES.JUNIOR_LAWYER, firm1),
      resource: { ownerId: user2, lawFirmId: firm1 },
      expected: false,
      description: 'Junior lawyer cannot access other user resource',
    },
    // Senior lawyer can access resources in firm
    {
      user: createMockUserContext(ROLES.SENIOR_LAWYER, firm1),
      resource: { ownerId: user2, lawFirmId: firm1 },
      expected: true,
      description: 'Senior lawyer accesses resource in same firm',
    },
  ]

  return accessTests.map(test => {
    const actual = canAccessResource(
      test.user,
      test.resource.ownerId,
      test.resource.lawFirmId
    )

    return {
      ...test,
      actual,
      passed: test.expected === actual,
    }
  })
}

// Run all tests
export function runAllRBACTests() {
  console.log('🔐 Running RBAC Tests...\n')

  console.log('📋 Testing Role Permissions...')
  const permissionResults = testRolePermissions()

  console.log('📊 Testing Role Hierarchy...')
  const hierarchyResults = testRoleHierarchy()

  console.log('🔒 Testing Resource Access...')
  const accessResults = testResourceAccess()

  // Summary
  const allPermissionTests = Object.values(permissionResults).flatMap(
    roleTests => Object.values(roleTests as Record<string, unknown>)
  )
  const permissionPassed = allPermissionTests.filter(
    (test: { passed?: boolean }) => test.passed
  ).length
  const permissionTotal = allPermissionTests.length

  const hierarchyPassed = hierarchyResults.filter(test => test.passed).length
  const hierarchyTotal = hierarchyResults.length

  const accessPassed = accessResults.filter(test => test.passed).length
  const accessTotal = accessResults.length

  console.log('\n📈 Test Results Summary:')
  console.log(`Permission Tests: ${permissionPassed}/${permissionTotal} passed`)
  console.log(`Hierarchy Tests: ${hierarchyPassed}/${hierarchyTotal} passed`)
  console.log(`Access Tests: ${accessPassed}/${accessTotal} passed`)

  const allPassed =
    permissionPassed === permissionTotal &&
    hierarchyPassed === hierarchyTotal &&
    accessPassed === accessTotal

  console.log(
    `\n${allPassed ? '✅' : '❌'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`
  )

  return {
    permissions: permissionResults,
    hierarchy: hierarchyResults,
    access: accessResults,
    summary: {
      allPassed,
      permissionTests: { passed: permissionPassed, total: permissionTotal },
      hierarchyTests: { passed: hierarchyPassed, total: hierarchyTotal },
      accessTests: { passed: accessPassed, total: accessTotal },
    },
  }
}

// Export for use in actual test framework
const rbacTestExports = {
  testRolePermissions,
  testRoleHierarchy,
  testResourceAccess,
  runAllRBACTests,
}

export default rbacTestExports
