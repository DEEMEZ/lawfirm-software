import { Client } from 'pg'

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'lawfirm_db',
  user: 'postgres',
  password: 'Ali.rayyan001',
})

await client.connect()

console.log('🔍 Checking superadmin user state...')

// Check platform user
const platformUserResult = await client.query(`
  SELECT id, email, name, "isActive"
  FROM platform_users
  WHERE email = 'superadmin@lawfirm.com'
`)

console.log('📋 Platform User:', platformUserResult.rows[0] || 'Not found')

// Check if they have any law firm users (should be EMPTY for superadmin)
const lawFirmUsersResult = await client.query(
  `
  SELECT u.id, u.law_firm_id, lf.name as law_firm_name
  FROM users u
  JOIN law_firms lf ON u.law_firm_id = lf.id
  WHERE u.platform_user_id = $1
`,
  [platformUserResult.rows[0]?.id]
)

console.log('🏢 Law Firm Users:', lawFirmUsersResult.rows)
console.log('❓ Expected: EMPTY array (no law firm users = superadmin)')

if (lawFirmUsersResult.rows.length > 0) {
  console.log(
    '❌ PROBLEM: Superadmin has law firm users! This will prevent super_admin role.'
  )
  console.log('🔧 Fix: Delete these law firm user associations.')
} else {
  console.log(
    '✅ GOOD: Superadmin has no law firm users (will get super_admin role)'
  )
}

// Check all platform users without law firm users (should be superadmins)
const allSuperadminsResult = await client.query(`
  SELECT pu.id, pu.email, pu.name
  FROM platform_users pu
  LEFT JOIN users u ON pu.id = u.platform_user_id
  WHERE u.id IS NULL
  AND pu."isActive" = true
`)

console.log('👑 All Superadmins (platform users without law firm users):')
console.log(allSuperadminsResult.rows)

await client.end()
