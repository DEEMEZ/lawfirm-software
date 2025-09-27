//  node scripts/create-superadmin.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createSuperAdmin() {
  try {
    const email = 'alirayyan001@gmail.com'
    const password = 'alirayyan001'
    const name = 'Ali Rayyan'

    console.log('🚀 Creating superadmin user...')

    // Check if user already exists
    const existingUser = await prisma.platformUser.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('❌ User with this email already exists!')
      return
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create the platform user
    const platformUser = await prisma.platformUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isActive: true,
      },
    })

    console.log('✅ Superadmin user created successfully!')
    console.log(`📧 Email: ${email}`)
    console.log(`👤 Name: ${name}`)
    console.log(`🆔 ID: ${platformUser.id}`)
    console.log('\n🔑 Login credentials:')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log(
      '\n⚡ This user has SUPER_ADMIN role with platform-level permissions'
    )
  } catch (error) {
    console.error('❌ Error creating superadmin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createSuperAdmin()
