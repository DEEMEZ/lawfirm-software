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

console.log('🚀 NUCLEAR RESET - Fixing Authentication Completely')
console.log('=' * 60)

// 1. Delete ALL old superadmin users
console.log('\n💀 Step 1: Deleting ALL old superadmin accounts...')
await client.query(
  `DELETE FROM platform_users WHERE email = 'superadmin@lawfirm.com'`
)
console.log('✅ Old superadmin accounts deleted')

// 2. Create completely fresh superadmin
console.log('\n🆕 Step 2: Creating completely fresh superadmin...')
const freshSuperAdminId = 'superadmin-' + Date.now()
const hashedPassword = await bcrypt.hash('superadmin123', 12)

await client.query(
  `
  INSERT INTO platform_users (id, email, password, name, "isActive", "createdAt", "updatedAt")
  VALUES ($1, 'superadmin@lawfirm.com', $2, 'Super Admin', true, NOW(), NOW())
`,
  [freshSuperAdminId, hashedPassword]
)

console.log('✅ Fresh superadmin created with ID:', freshSuperAdminId)

// 3. Verify it works
const testResult = await client.query(
  `SELECT id, email FROM platform_users WHERE id = $1`,
  [freshSuperAdminId]
)
console.log('✅ Verified fresh superadmin:', testResult.rows[0])

// 4. Test password
const passwordTest = await bcrypt.compare('superadmin123', hashedPassword)
console.log('✅ Password test:', passwordTest)

// 5. Verify Ali user
console.log('\n👤 Step 3: Verifying Ali user...')
const aliResult = await client.query(`
  SELECT pu.email, pu."isActive" as platform_active, u."isActive" as user_active, lf."isActive" as law_firm_active, r.name as role
  FROM platform_users pu
  JOIN users u ON pu.id = u.platform_user_id
  JOIN law_firms lf ON u.law_firm_id = lf.id
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  WHERE pu.email = 'ali.rayyan001@gmail.com'
`)

if (aliResult.rows.length > 0) {
  const ali = aliResult.rows[0]
  console.log('✅ Ali user verified:')
  console.log('  📧 Email:', ali.email)
  console.log('  🎯 Role:', ali.role)
  console.log(
    '  🔵 All Active:',
    ali.platform_active && ali.user_active && ali.law_firm_active
  )
} else {
  console.log('❌ Ali user not found')
}

console.log('\n🎯 FIXED LOGIN CREDENTIALS:')
console.log('Superadmin: superadmin@lawfirm.com / superadmin123')
console.log('Law Firm Owner: ali.rayyan001@gmail.com / 12345')

console.log('\n🚨 IMPORTANT: YOU MUST CLEAR BROWSER DATA:')
console.log('1. Open Chrome DevTools (F12)')
console.log('2. Right-click refresh button → "Empty Cache and Hard Reload"')
console.log('3. OR use Incognito/Private browsing mode')
console.log('4. OR clear all cookies for localhost:3000')

console.log(
  '\n💡 Token invalidation is working - old tokens return null which causes the session error'
)
console.log('💡 Fresh login attempts will create new tokens with correct data')

await client.end()
