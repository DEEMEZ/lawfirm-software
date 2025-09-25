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

console.log('🔧 Creating proper superadmin user...')

const hashedPassword = await bcrypt.hash('superadmin123', 12)

// Create ONLY a platform user (no law firm users)
// This will make NextAuth identify them as super_admin
await client.query(
  `
  INSERT INTO platform_users (id, email, password, name, "isActive", "createdAt", "updatedAt")
  VALUES ('superadmin001', 'superadmin@lawfirm.com', $1, 'Super Administrator', true, NOW(), NOW())
  ON CONFLICT (email) DO NOTHING
`,
  [hashedPassword]
)

console.log('✅ Superadmin created successfully!')
console.log('📧 Email: superadmin@lawfirm.com')
console.log('🔑 Password: superadmin123')
console.log('🎯 Role: super_admin (auto-detected by having no law firm users)')
console.log('🔄 Will redirect to: /admin dashboard')

console.log('\n📝 How it works:')
console.log('• Platform user exists but has no law firm users')
console.log('• NextAuth detects this and assigns role: "super_admin"')
console.log('• Main page redirects super_admin to /admin')
console.log('• Admin dashboard requires super_admin role')

await client.end()
