import { Client } from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function setupRLS() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'lawfirm_db',
    user: 'postgres',
    password: 'Ali.rayyan001',
  })

  try {
    console.log('🔄 Setting up Row Level Security...')
    await client.connect()

    // Read the RLS SQL file
    const rlsSQL = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/enable_rls.sql'),
      'utf-8'
    )

    // Execute the RLS setup
    await client.query(rlsSQL)
    console.log('✅ Row Level Security policies created successfully!')

    // Test the policies
    console.log('🧪 Testing RLS policies...')

    // Set a test tenant context
    await client.query("SELECT set_tenant_context('test-firm-id', 'user')")

    // Test that queries work with tenant context
    const result = await client.query(
      "SELECT current_setting('app.current_law_firm_id', true)"
    )
    console.log(
      '✅ Tenant context test passed:',
      result.rows[0].current_setting
    )

    // Clear context
    await client.query('SELECT clear_tenant_context()')
  } catch (error) {
    console.error('❌ RLS setup failed:')
    console.error('Error:', error.message)

    if (error.message.includes('already exists')) {
      console.log('💡 RLS policies may already be set up. This is OK.')
    } else {
      process.exit(1)
    }
  } finally {
    await client.end()
  }
}

setupRLS()
