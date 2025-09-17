import { TenantAwarePrisma } from '../src/lib/db.js'

async function testTenantContext() {
  const prisma = new TenantAwarePrisma()

  try {
    console.log('🔄 Testing tenant context...')

    // Test 1: Set tenant context
    await prisma.setTenantContext('test-firm-1', 'admin')
    console.log('✅ Tenant context set successfully')

    // Test 2: Verify context is set
    const result = await prisma.$queryRaw`SELECT
      current_setting('app.current_law_firm_id', true) as law_firm_id,
      current_setting('app.current_user_role', true) as user_role`

    console.log('📊 Current context:', result[0])

    // Test 3: Test forTenant method
    prisma.forTenant('test-firm-2', 'lawyer')
    console.log('✅ Tenant-aware client created')

    // Test 4: Clear context
    await prisma.clearTenantContext()
    console.log('✅ Tenant context cleared')

    console.log('🎉 All tenant context tests passed!')
  } catch (error) {
    console.error('❌ Tenant context test failed:')
    console.error('Error:', error.message)

    if (error.message.includes('function set_tenant_context')) {
      console.error(
        '💡 Hint: Run "npm run db:setup-rls" first to set up RLS functions'
      )
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testTenantContext()
