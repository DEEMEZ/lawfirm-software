import { Client } from 'pg'

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'lawfirm_db',
  user: 'postgres',
  password: 'Ali.rayyan001',
})

await client.connect()

console.log('🧹 Clearing any session-related tables if they exist...')

// Clear any NextAuth session tables (though we use JWT, not database sessions)
try {
  await client.query(`DELETE FROM sessions`)
  console.log('✅ Cleared sessions table')
} catch {
  console.log('ℹ️ No sessions table to clear (using JWT sessions)')
}

try {
  await client.query(`DELETE FROM accounts`)
  console.log('✅ Cleared accounts table')
} catch {
  console.log('ℹ️ No accounts table to clear')
}

try {
  await client.query(`DELETE FROM verification_tokens`)
  console.log('✅ Cleared verification tokens')
} catch {
  console.log('ℹ️ No verification tokens table to clear')
}

console.log('\n🔄 Session cache should be cleared when you restart the browser')
console.log('💡 To fully test:')
console.log('1. Close all browser tabs')
console.log('2. Open new incognito/private window')
console.log('3. Go to http://localhost:3000')
console.log('4. Login with fresh session')

await client.end()
