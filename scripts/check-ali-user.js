import { Client } from 'pg'

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'lawfirm_db',
  user: 'postgres',
  password: 'Ali.rayyan001',
})

await client.connect()

console.log('🔍 Checking Ali Rayyan user setup...')

// Get full user data including roles
const userResult = await client.query(`
  SELECT
    pu.id as platform_user_id,
    pu.email,
    pu.name,
    pu."isActive" as platform_active,
    u.id as user_id,
    u."isActive" as user_active,
    u."joinedAt",
    lf.id as law_firm_id,
    lf.name as law_firm_name,
    lf.slug,
    lf."isActive" as law_firm_active,
    array_agg(r.name) as roles
  FROM platform_users pu
  LEFT JOIN users u ON pu.id = u.platform_user_id
  LEFT JOIN law_firms lf ON u.law_firm_id = lf.id
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  LEFT JOIN roles r ON ur.role_id = r.id
  WHERE pu.email = 'ali.rayyan001@gmail.com'
  GROUP BY pu.id, pu.email, pu.name, pu."isActive", u.id, u."isActive", u."joinedAt", lf.id, lf.name, lf.slug, lf."isActive"
`)

if (userResult.rows.length === 0) {
  console.log('❌ No user found for ali.rayyan001@gmail.com')
  await client.end()
  process.exit(1)
}

const user = userResult.rows[0]
console.log('👤 User Details:')
console.log('  📧 Email:', user.email)
console.log('  👤 Name:', user.name)
console.log('  🔵 Platform User Active:', user.platform_active)
console.log('  🔵 User Active:', user.user_active)
console.log('  📅 Joined At:', user.joinedAt)
console.log('  🏢 Law Firm:', user.law_firm_name)
console.log('  🔵 Law Firm Active:', user.law_firm_active)
console.log(
  '  🎯 Roles:',
  user.roles.filter(r => r !== null)
)

// Check if this matches NextAuth expectations
console.log('\n🔍 NextAuth Compatibility Check:')
console.log('  ✅ Platform user exists:', !!user.platform_user_id)
console.log('  ✅ Platform user active:', user.platform_active)
console.log('  ✅ Has law firm user:', !!user.user_id)
console.log('  ✅ User is active:', user.user_active)
console.log('  ✅ Law firm exists:', !!user.law_firm_id)
console.log('  ✅ Law firm is active:', user.law_firm_active)
console.log('  ✅ Has roles:', user.roles.filter(r => r !== null).length > 0)

// Diagnose any issues
const issues = []
if (!user.platform_active) issues.push('Platform user is not active')
if (!user.user_active) issues.push('User is not active')
if (!user.law_firm_active) issues.push('Law firm is not active')
if (user.roles.filter(r => r !== null).length === 0)
  issues.push('User has no roles')

if (issues.length > 0) {
  console.log('\n❌ Issues found:')
  issues.forEach(issue => console.log('  -', issue))
} else {
  console.log('\n✅ All checks passed - user should be able to login!')
  console.log('\n🤔 If login still fails, the issue might be:')
  console.log('  1. Frontend redirect logic')
  console.log('  2. Session callback issues')
  console.log('  3. Browser cache/cookies')
}

await client.end()
