#!/usr/bin/env node

import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...')

  try {
    // Test basic connection
    console.log('1️⃣ Testing Prisma connection...')
    await prisma.$connect()
    console.log('✅ Prisma connected successfully')

    // Test raw query
    console.log('2️⃣ Testing raw database query...')
    const result =
      await prisma.$queryRaw`SELECT NOW() as current_time, version() as pg_version`
    console.log('✅ Raw query successful')
    console.log(`🕐 Database time: ${result[0].current_time}`)
    console.log(`🗃️ PostgreSQL version: ${result[0].pg_version}`)

    // Test tables exist
    console.log('3️⃣ Checking if tables exist...')
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    if (tables.length === 0) {
      console.log('⚠️ No tables found - you may need to run migrations')
    } else {
      console.log(`✅ Found ${tables.length} tables:`)
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`)
      })
    }

    // Test essential tables
    console.log('4️⃣ Testing essential tables...')
    const essentialTables = ['platform_users', 'law_firms', 'users', 'roles']

    for (const tableName of essentialTables) {
      try {
        const count = await prisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        `

        if (count[0].count > 0) {
          const recordCount = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM ${tableName}`
          )
          console.log(
            `  ✅ ${tableName}: exists (${recordCount[0].count} records)`
          )
        } else {
          console.log(`  ❌ ${tableName}: missing`)
        }
      } catch (error) {
        console.log(`  ❌ ${tableName}: error - ${error.message}`)
      }
    }

    // Test if migrations are up to date
    console.log('5️⃣ Checking migration status...')
    try {
      const migrations = await prisma.$queryRaw`
        SELECT * FROM _prisma_migrations
        ORDER BY finished_at DESC
        LIMIT 5
      `
      console.log(`✅ Found ${migrations.length} recent migrations`)
      if (migrations.length > 0) {
        const latest = migrations[0]
        console.log(
          `📅 Latest migration: ${latest.migration_name} (${latest.finished_at})`
        )
      }
    } catch (error) {
      console.log(
        '⚠️ Migration table not accessible - may need to run migrations'
      )
    }

    console.log('\n🎉 Database connection test completed successfully!')
    console.log('🚀 Your database is ready to use')
  } catch (error) {
    console.error('\n❌ Database connection test failed!')
    console.error('🔴 Error details:', error.message)

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:')
      console.log('  - Make sure PostgreSQL is running')
      console.log('  - Check your DATABASE_URL in .env file')
      console.log('  - Verify database credentials')
    } else if (error.code === 'P1001') {
      console.log('\n💡 Database server is unreachable:')
      console.log('  - Check if PostgreSQL service is running')
      console.log('  - Verify host and port in DATABASE_URL')
    } else if (error.code === 'P1003') {
      console.log('\n💡 Database does not exist:')
      console.log('  - Create the database first')
      console.log('  - Run: createdb lawfirm_db')
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testDatabaseConnection()
