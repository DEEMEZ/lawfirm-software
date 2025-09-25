import { Client } from 'pg'

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'lawfirm_db',
  user: 'postgres',
  password: 'Ali.rayyan001',
})

await client.connect()

console.log('🗑️ Deleting existing superadmin...')

// Delete in reverse order due to foreign key constraints
await client.query(`DELETE FROM user_roles WHERE id = 'userrole001'`)
await client.query(`DELETE FROM roles WHERE id = 'superrole001'`)
await client.query(`DELETE FROM users WHERE id = 'systemuser001'`)
await client.query(`DELETE FROM law_firms WHERE id = 'systemfirm001'`)
await client.query(`DELETE FROM platform_users WHERE id = 'superadmin001'`)

console.log('✅ Superadmin deleted successfully!')

await client.end()
