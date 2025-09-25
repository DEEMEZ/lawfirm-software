import { Client } from 'pg'
import bcrypt from 'bcryptjs'

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'lawfirm_db',
  user: 'postgres',
  password: 'Ali.rayyan001',
})

await client.connect()

console.log('🔍 Debugging Passwords...')

// Check superadmin password
const superAdminResult = await client.query(`
  SELECT id, email, password
  FROM platform_users
  WHERE email = 'superadmin@lawfirm.com'
`)

if (superAdminResult.rows.length > 0) {
  const sa = superAdminResult.rows[0]
  console.log('\n🔍 Superadmin:', sa.email)
  console.log('Password hash starts with:', sa.password?.substring(0, 10))
  console.log('Password hash length:', sa.password?.length)

  // Test with correct password
  const validPassword = await bcrypt.compare('superadmin123', sa.password)
  console.log('superadmin123:', validPassword)

  // Test rehashing
  const newHash = await bcrypt.hash('superadmin123', 12)
  console.log('New hash would be:', newHash.substring(0, 10))
}

// Check Ali user password
const aliResult = await client.query(`
  SELECT id, email, password
  FROM platform_users
  WHERE email = 'ali.rayyan001@gmail.com'
`)

if (aliResult.rows.length > 0) {
  const ali = aliResult.rows[0]
  console.log('\n🔍 Ali user:', ali.email)
  console.log('Password hash starts with:', ali.password?.substring(0, 10))
  console.log('Password hash length:', ali.password?.length)

  // Test different passwords
  const passwords = ['123456', 'ali123', 'password123']
  for (const pwd of passwords) {
    const isValid = await bcrypt.compare(pwd, ali.password)
    console.log(`${pwd}:`, isValid)
  }
}

await client.end()
