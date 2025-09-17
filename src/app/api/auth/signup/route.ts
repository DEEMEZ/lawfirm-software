import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, firmName } = await request.json()

    if (!email || !password || !firmName) {
      return NextResponse.json(
        { error: 'Email, password, and firm name are required' },
        { status: 400 }
      )
    }

    // Check if platform user already exists
    const existingUser = await prisma.platformUser.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Start transaction to create firm and user
    const result = await prisma.$transaction(async tx => {
      // Create law firm
      const lawFirm = await tx.lawFirm.create({
        data: {
          name: firmName,
          slug: firmName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        },
      })

      // Create platform user
      const hashedPassword = await hashPassword(password)
      const platformUser = await tx.platformUser.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      })

      // Create default owner role for the firm
      const ownerRole = await tx.role.create({
        data: {
          lawFirmId: lawFirm.id,
          name: 'owner',
          description: 'Firm Owner - Full Access',
          permissions: ['*'], // All permissions
          isSystem: true,
        },
      })

      // Create user profile in the firm
      const user = await tx.user.create({
        data: {
          lawFirmId: lawFirm.id,
          platformUserId: platformUser.id,
          joinedAt: new Date(),
        },
      })

      // Assign owner role
      await tx.userRole.create({
        data: {
          lawFirmId: lawFirm.id,
          userId: user.id,
          roleId: ownerRole.id,
        },
      })

      return {
        platformUser,
        lawFirm,
        user,
        role: ownerRole,
      }
    })

    return NextResponse.json({
      message: 'User and firm created successfully',
      user: {
        id: result.user.id,
        email: result.platformUser.email,
        name: result.platformUser.name,
        lawFirmId: result.lawFirm.id,
        lawFirmName: result.lawFirm.name,
        role: result.role.name,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
