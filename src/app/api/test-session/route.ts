// Test route to debug session data
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    // Return full session data for debugging
    return NextResponse.json({
      sessionExists: !!session,
      user: session.user,
      userRole: session.user?.role,
      userLawFirmId: session.user?.lawFirmId,
      isExpectedSuperadmin: session.user?.role === 'super_admin',
    })
  } catch (error) {
    console.error('Test session error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
