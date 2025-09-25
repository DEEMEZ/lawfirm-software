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

const hashedPassword = await bcrypt.hash('superadmin123', 12)

// Quick SQL inserts
await client.query(
  `
  INSERT INTO platform_users (id, email, password, name, "isActive", "createdAt", "updatedAt")
  VALUES ('superadmin001', 'superadmin@lawfirm.com', $1, 'Super Administrator', true, NOW(), NOW())
  ON CONFLICT (email) DO NOTHING
`,
  [hashedPassword]
)

await client.query(`
  INSERT INTO law_firms (id, name, slug, domain, plan, "isActive", settings, "createdAt", "updatedAt")
  VALUES ('systemfirm001', 'System Administration', 'system-admin', 'system.lawfirm.com', 'ENTERPRISE', true, '{"systemAccess": true}', NOW(), NOW())
  ON CONFLICT (slug) DO NOTHING
`)

await client.query(`
  INSERT INTO users (id, law_firm_id, platform_user_id, "isActive", "invitedAt", "joinedAt", "createdAt", "updatedAt")
  VALUES ('systemuser001', 'systemfirm001', 'superadmin001', true, NOW(), NOW(), NOW(), NOW())
  ON CONFLICT (law_firm_id, platform_user_id) DO NOTHING
`)

await client.query(`
  INSERT INTO roles (id, law_firm_id, name, description, permissions, "isSystem", "createdAt", "updatedAt")
  VALUES ('superrole001', 'systemfirm001', 'Super Administrator', 'System super administrator', '["system.global_access"]', true, NOW(), NOW())
  ON CONFLICT (law_firm_id, name) DO NOTHING
`)

await client.query(`
  INSERT INTO user_roles (id, law_firm_id, user_id, role_id, "assignedAt", assigned_by)
  VALUES ('userrole001', 'systemfirm001', 'systemuser001', 'superrole001', NOW(), 'systemuser001')
  ON CONFLICT (law_firm_id, user_id, role_id) DO NOTHING
`)

console.log('✅ Superadmin created!')
console.log('📧 Email: superadmin@lawfirm.com')
console.log('🔑 Password: superadmin123')

await client.end()
