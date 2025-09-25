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

console.log('🧪 Testing Authentication Setup')
console.log('=' * 50)

// Test 1: Verify fresh superadmin exists
console.log('\n🔍 Test 1: Checking fresh superadmin...')
const superAdminResult = await client.query(`
  SELECT id, email, name, "isActive", "createdAt"
  FROM platform_users
  WHERE email = 'superadmin@lawfirm.com'
`)

if (superAdminResult.rows.length > 0) {
  const sa = superAdminResult.rows[0]
  console.log('✅ Fresh superadmin found:')
  console.log('  📧 Email:', sa.email)
  console.log('  🆔 ID:', sa.id)
  console.log('  🔵 Active:', sa.isActive)
  console.log('  📅 Created:', sa.createdAt)

  // Test password
  const passwordTest = await bcrypt.compare('superadmin123', sa.password || '')
  console.log('  🔐 Password works:', passwordTest)
} else {
  console.log('❌ No fresh superadmin found')
}

// Test 2: Verify law firm owner
console.log('\n🔍 Test 2: Checking law firm owner...')
const ownerResult = await client.query(`
  SELECT
    pu.id as platform_user_id,
    pu.email,
    pu.name,
    pu."isActive" as platform_active,
    u.id as user_id,
    u."isActive" as user_active,
    lf.id as law_firm_id,
    lf.name as law_firm_name,
    lf."isActive" as law_firm_active,
    r.name as role_name
  FROM platform_users pu
  JOIN users u ON pu.id = u.platform_user_id
  JOIN law_firms lf ON u.law_firm_id = lf.id
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  WHERE pu.email = 'ali.rayyan001@gmail.com'
`)

if (ownerResult.rows.length > 0) {
  const owner = ownerResult.rows[0]
  console.log('✅ Law firm owner found:')
  console.log('  📧 Email:', owner.email)
  console.log('  👤 Name:', owner.name)
  console.log('  🆔 Platform User ID:', owner.platform_user_id)
  console.log('  🆔 User ID:', owner.user_id)
  console.log('  🏢 Law Firm:', owner.law_firm_name)
  console.log('  🎯 Role:', owner.role_name)
  console.log(
    '  🔵 All Active:',
    owner.platform_active && owner.user_active && owner.law_firm_active
  )

  // Test password
  const platformUser = await client.query(
    `
    SELECT password FROM platform_users WHERE id = $1
  `,
    [owner.platform_user_id]
  )

  if (platformUser.rows.length > 0) {
    const passwordTest = await bcrypt.compare(
      '123456',
      platformUser.rows[0].password
    )
    console.log('  🔐 Password works:', passwordTest)
  }
} else {
  console.log('❌ No law firm owner found')
}

console.log('\n🎯 Expected Login Behaviors:')
console.log(
  '1. superadmin@lawfirm.com + superadmin123 → should redirect to /admin with role=super_admin'
)
console.log(
  '2. ali.rayyan001@gmail.com + 123456 → should redirect to /dashboard with role=Owner'
)

console.log('\n💡 Architecture Notes:')
console.log('- Fresh JWT tokens will have tokenVersion field')
console.log('- Old tokens without tokenVersion will be invalidated')
console.log(
  '- Superadmin detection only checks role=super_admin (no hardcoded IDs)'
)
console.log('- Law firm users redirect based on lawFirmId presence')

await client.end()
