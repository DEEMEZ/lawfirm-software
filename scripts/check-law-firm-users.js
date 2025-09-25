import { Client } from 'pg'

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'lawfirm_db',
  user: 'postgres',
  password: 'Ali.rayyan001',
})

await client.connect()

console.log('🔍 Checking law firm and users setup...')

// Check all law firms
const lawFirmsResult = await client.query(`
  SELECT id, name, slug, "isActive"
  FROM law_firms
  ORDER BY "createdAt" DESC
`)

console.log('🏢 Law Firms:')
lawFirmsResult.rows.forEach(firm => {
  console.log(`  - ${firm.name} (${firm.slug}) - Active: ${firm.isActive}`)
})

// Check all platform users
const platformUsersResult = await client.query(`
  SELECT id, email, name, "isActive"
  FROM platform_users
  ORDER BY "createdAt" DESC
`)

console.log('\n👤 Platform Users:')
platformUsersResult.rows.forEach(user => {
  console.log(`  - ${user.name} (${user.email}) - Active: ${user.isActive}`)
})

// Check users table (links platform users to law firms)
const usersResult = await client.query(`
  SELECT u.id, u.platform_user_id, u.law_firm_id, u."isActive",
         pu.email, pu.name as user_name, lf.name as law_firm_name
  FROM users u
  JOIN platform_users pu ON u.platform_user_id = pu.id
  JOIN law_firms lf ON u.law_firm_id = lf.id
  ORDER BY u."createdAt" DESC
`)

console.log('\n🔗 User-Firm Links (users table):')
if (usersResult.rows.length === 0) {
  console.log('  ❌ NO ENTRIES! This is the problem.')
  console.log(
    '  📝 Law firm owners need entries in the users table to link them to their firms.'
  )
} else {
  usersResult.rows.forEach(user => {
    console.log(`  - ${user.user_name} (${user.email}) → ${user.law_firm_name}`)
  })
}

// Check for law firm owner without user table entry
const orphanedOwnersResult = await client.query(`
  SELECT pu.email, pu.name,
         CASE WHEN u.id IS NULL THEN 'MISSING USER ENTRY' ELSE 'HAS USER ENTRY' END as status
  FROM platform_users pu
  LEFT JOIN users u ON pu.id = u.platform_user_id
  WHERE pu.email != 'superadmin@lawfirm.com'
`)

console.log('\n🚨 Platform users without user table entries:')
orphanedOwnersResult.rows.forEach(owner => {
  if (owner.status === 'MISSING USER ENTRY') {
    console.log(
      `  ❌ ${owner.name} (${owner.email}) - Missing users table entry!`
    )
  } else {
    console.log(`  ✅ ${owner.name} (${owner.email}) - Has users table entry`)
  }
})

await client.end()
