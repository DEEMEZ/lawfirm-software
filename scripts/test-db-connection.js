import { Client } from 'pg'

async function testConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'lawfirm_db',
    user: 'postgres',
    password: 'Ali.rayyan001',
  })

  try {
    console.log('🔄 Testing database connection...')
    await client.connect()

    const result = await client.query('SELECT 1 as test, NOW() as timestamp')
    console.log('✅ Database connection successful!')
    console.log('📊 Test query result:', result.rows[0])

    // Test if we can create/drop a test table
    await client.query(
      'CREATE TABLE IF NOT EXISTS connection_test (id SERIAL PRIMARY KEY)'
    )
    await client.query('DROP TABLE connection_test')
    console.log('✅ Database permissions verified!')
  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error('Error:', error.message)

    if (error.code === 'ENOTFOUND') {
      console.error('💡 Hint: Check if DATABASE_URL hostname is correct')
    } else if (error.code === 'ECONNREFUSED') {
      console.error(
        '💡 Hint: Check if PostgreSQL is running and port is correct'
      )
    } else if (error.code === '28P01') {
      console.error('💡 Hint: Check username and password in DATABASE_URL')
    } else if (error.code === '3D000') {
      console.error('💡 Hint: Database does not exist, create it first')
    }

    process.exit(1)
  } finally {
    await client.end()
  }
}

testConnection()
