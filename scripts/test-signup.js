import { Client } from 'pg'

async function testSignup() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'lawfirm_db',
    user: 'postgres',
    password: 'Ali.rayyan001',
  })

  try {
    console.log('🔄 Testing signup database operations...')
    await client.connect()

    // Test if we can check for existing users
    const existingUser = await client.query(
      'SELECT * FROM platform_users WHERE email = $1',
      ['test@example.com']
    )
    console.log(
      '✅ Platform users query successful:',
      existingUser.rows.length,
      'results'
    )

    // Test creating a law firm
    const lawFirmResult = await client.query(
      `
      INSERT INTO law_firms (id, name, slug, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `,
      ['test-firm-123', 'Test Firm', 'test-firm']
    )
    console.log('✅ Law firm created:', lawFirmResult.rows[0])

    // Test creating a platform user
    const platformUserResult = await client.query(
      `
      INSERT INTO platform_users (id, email, password, name, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `,
      ['test-user-123', 'test@example.com', 'hashedpassword', 'Test User']
    )
    console.log('✅ Platform user created:', platformUserResult.rows[0])

    // Clean up
    await client.query('DELETE FROM platform_users WHERE id = $1', [
      'test-user-123',
    ])
    await client.query('DELETE FROM law_firms WHERE id = $1', ['test-firm-123'])
    console.log('✅ Cleanup completed')

    console.log('🎉 All database operations working!')
  } catch (error) {
    console.error('❌ Database test failed:')
    console.error('Error:', error.message)
  } finally {
    await client.end()
  }
}

testSignup()
