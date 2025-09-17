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
  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error('Error:', error.message)
    console.error('Error code:', error.code)

    if (error.code === 'ENOTFOUND') {
      console.error('💡 Hint: Check if PostgreSQL is running on localhost:5432')
    } else if (error.code === 'ECONNREFUSED') {
      console.error(
        '💡 Hint: PostgreSQL might not be running or listening on port 5432'
      )
    } else if (error.code === '28P01') {
      console.error('💡 Hint: Check username and password')
    } else if (error.code === '3D000') {
      console.error('💡 Hint: Database "lawfirm_db" does not exist')
    }

    process.exit(1)
  } finally {
    await client.end()
  }
}

testConnection()
