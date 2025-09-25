console.log('🔧 Starting debug script...')

try {
  console.log('📦 Importing modules...')
  const { Client } = await import('pg')
  const bcrypt = (await import('bcryptjs')).default
  console.log('✅ Modules imported successfully')

  console.log('🔌 Creating database client...')
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'lawfirm_db',
    user: 'postgres',
    password: 'Ali.rayyan001',
  })
  console.log('✅ Client created')

  console.log('🔗 Connecting to database...')
  await client.connect()
  console.log('✅ Connected to database')

  console.log('🧪 Running test query...')
  const result = await client.query('SELECT 1 as test')
  console.log('✅ Test query successful:', result.rows[0])

  console.log('🔐 Testing bcrypt...')
  const hash = await bcrypt.hash('test123', 12)
  console.log('✅ Bcrypt hash created:', hash.substring(0, 20) + '...')

  console.log('🔌 Closing connection...')
  await client.end()
  console.log('✅ Connection closed')

  console.log('🎉 All tests passed!')
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}
