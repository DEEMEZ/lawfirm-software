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

console.log('🔍 Checking password for ali.rayyan001@gmail.com...')

// Get the hashed password from database
const userResult = await client.query(`
  SELECT id, email, password
  FROM platform_users
  WHERE email = 'ali.rayyan001@gmail.com'
`)

if (userResult.rows.length === 0) {
  console.log('❌ No user found for ali.rayyan001@gmail.com')
  await client.end()
  process.exit(1)
}

const user = userResult.rows[0]
console.log('👤 Found user:', user.email)

// Test different possible passwords
const possiblePasswords = [
  '123456',
  'ali123',
  'password123',
  'Ali123',
  'ali.rayyan001',
  'superadmin123',
]

console.log('\n🔐 Testing passwords...')

for (const testPassword of possiblePasswords) {
  try {
    const isValid = await bcrypt.compare(testPassword, user.password)
    if (isValid) {
      console.log(`✅ CORRECT PASSWORD: "${testPassword}"`)
    } else {
      console.log(`❌ Wrong password: "${testPassword}"`)
    }
  } catch (error) {
    console.log(`❌ Error testing password "${testPassword}":`, error.message)
  }
}

console.log(
  '\n💡 If none of the passwords work, the law firm creation might have failed'
)
console.log('💡 or used a different password than expected.')

await client.end()
