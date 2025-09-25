import { Client } from 'pg'

async function testConnection() {
  console.log('🔄 Testing database connection...')

  // Try different connection formats
  const configs = [
    {
      name: 'Direct config',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'lawfirm_db',
        user: 'postgres',
        password: 'Ali.rayyan001',
      },
    },
    {
      name: 'Connection string with quoted password',
      config: {
        connectionString:
          'postgresql://postgres:"Ali.rayyan001"@localhost:5432/lawfirm_db',
      },
    },
    {
      name: 'Connection string with encoded password',
      config: {
        connectionString:
          'postgresql://postgres:Ali%2Erayyan001@localhost:5432/lawfirm_db',
      },
    },
  ]

  for (const { name, config } of configs) {
    console.log(`\n🧪 Testing ${name}...`)
    const client = new Client(config)

    try {
      await client.connect()
      const result = await client.query('SELECT 1 as test')
      console.log(`✅ ${name} - SUCCESS!`)
      console.log('📊 Result:', result.rows[0])
      await client.end()

      // If this works, update the .env file
      if (config.connectionString) {
        console.log(`\n💡 Use this DATABASE_URL: ${config.connectionString}`)
      } else {
        console.log(`\n💡 Use direct config format in your application`)
      }
      break
    } catch (error) {
      console.error(`❌ ${name} - FAILED:`, error.message)
      try {
        await client.end()
      } catch {}
    }
  }
}

testConnection().catch(console.error)
