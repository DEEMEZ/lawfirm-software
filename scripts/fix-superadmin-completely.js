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

console.log('🔧 Completely removing and recreating proper superadmin...')

// 1. Delete ALL related data for the superadmin
await client.query(`DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM users WHERE platform_user_id = 'superadmin001'
)`)

await client.query(`DELETE FROM users WHERE platform_user_id = 'superadmin001'`)

await client.query(`DELETE FROM roles WHERE law_firm_id = 'systemfirm001'`)

await client.query(`DELETE FROM law_firms WHERE id = 'systemfirm001'`)

await client.query(`DELETE FROM platform_users WHERE id = 'superadmin001'`)

console.log('🗑️ Cleaned up all existing superadmin data')

// 2. Create ONLY a platform user (no law firm, no users, no roles)
const hashedPassword = await bcrypt.hash('superadmin123', 12)

await client.query(
  `
  INSERT INTO platform_users (id, email, password, name, "isActive", "createdAt", "updatedAt")
  VALUES ('superadmin001', 'superadmin@lawfirm.com', $1, 'Super Administrator', true, NOW(), NOW())
`,
  [hashedPassword]
)

console.log('✅ Created pure platform-only superadmin!')

// 3. Verify it's clean
const checkResult = await client.query(`
  SELECT pu.email, COUNT(u.id) as user_count
  FROM platform_users pu
  LEFT JOIN users u ON pu.id = u.platform_user_id
  WHERE pu.email = 'superadmin@lawfirm.com'
  GROUP BY pu.email
`)

console.log('📊 Verification:', checkResult.rows[0])

if (checkResult.rows[0].user_count === '0') {
  console.log('✅ Perfect! Superadmin has NO law firm users')
  console.log('🎯 NextAuth will assign role: "super_admin"')
} else {
  console.log('❌ Error: Superadmin still has law firm users')
}

console.log('\n📝 Credentials:')
console.log('📧 Email: superadmin@lawfirm.com')
console.log('🔑 Password: superadmin123')
console.log('🚀 Expected role: super_admin')

await client.end()
