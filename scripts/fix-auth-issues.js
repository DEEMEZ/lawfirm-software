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

console.log('🛠️ Fixing authentication issues...')

// Delete existing superadmin
console.log('🗑️ Deleting existing superadmin...')
await client.query(
  `DELETE FROM platform_users WHERE email = 'superadmin@lawfirm.com'`
)

// Create new superadmin with correct setup
console.log('👤 Creating fresh superadmin with super_admin role...')
const hashedPassword = await bcrypt.hash('superadmin123', 12)

await client.query(
  `
  INSERT INTO platform_users (id, email, password, name, "isActive", "createdAt", "updatedAt")
  VALUES ('superadmin-new', 'superadmin@lawfirm.com', $1, 'Super Admin', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    "updatedAt" = NOW()
`,
  [hashedPassword]
)

console.log('✅ Superadmin created successfully!')
console.log('📝 Login with: superadmin@lawfirm.com / superadmin123')

console.log('\\n🔍 Testing Ali user login flow...')

// Verify Ali user setup
const aliResult = await client.query(`
  SELECT
    pu.id as platform_user_id,
    pu.email,
    pu.password,
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

if (aliResult.rows.length === 0) {
  console.log('❌ Ali user not found')
} else {
  const ali = aliResult.rows[0]
  console.log('👤 Ali user found:')
  console.log('  📧 Email:', ali.email)
  console.log('  🔵 Platform Active:', ali.platform_active)
  console.log('  🔵 User Active:', ali.user_active)
  console.log('  🔵 Law Firm Active:', ali.law_firm_active)
  console.log('  🎯 Role:', ali.role_name)

  // Test password
  const passwordTest = await bcrypt.compare('123456', ali.password)
  console.log('  🔐 Password 123456 works:', passwordTest)

  if (
    passwordTest &&
    ali.platform_active &&
    ali.user_active &&
    ali.law_firm_active
  ) {
    console.log('✅ Ali user should be able to login!')
  } else {
    console.log('❌ Ali user has login issues')
  }
}

console.log('\\n💡 Clear browser cache and try fresh login!')

await client.end()
