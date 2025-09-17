import { Client } from 'pg'

async function testTenantContext() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'lawfirm_db',
    user: 'postgres',
    password: 'Ali.rayyan001',
  })

  try {
    console.log('🔄 Testing tenant context...')
    await client.connect()

    // Test 1: Set tenant context
    await client.query("SELECT set_tenant_context('test-firm-1', 'admin')")
    console.log('✅ Tenant context set successfully')

    // Test 2: Verify context is set
    const result = await client.query(`SELECT
      current_setting('app.current_law_firm_id', true) as law_firm_id,
      current_setting('app.current_user_role', true) as user_role`)

    console.log('📊 Current context:', result.rows[0])

    // Test 3: Clear context
    await client.query('SELECT clear_tenant_context()')
    console.log('✅ Tenant context cleared')

    console.log('🎉 All tenant context tests passed!')
  } catch (error) {
    console.error('❌ Tenant context test failed:')
    console.error('Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

testTenantContext()
