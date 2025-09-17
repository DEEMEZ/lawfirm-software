import { Client } from 'pg'

async function checkTables() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'lawfirm_db',
    user: 'postgres',
    password: 'Ali.rayyan001',
  })

  try {
    console.log('🔄 Checking database tables...')
    await client.connect()

    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    console.log('📊 Tables found:')
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })

    if (result.rows.length === 0) {
      console.log('❌ No tables found! Migration might have failed.')
    }
  } catch (error) {
    console.error('❌ Error checking tables:', error.message)
  } finally {
    await client.end()
  }
}

checkTables()
