// Super-Admin Impersonation API
// Purpose: Impersonate users with reason tracking and audit logging

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/auth-guards'
import { ROLES } from '@/lib/rbac'
import { generateToken } from '@/lib/auth'

// POST /api/admin/impersonate - Start impersonation session
export const POST = withRole(
  ROLES.SUPER_ADMIN,
  async (request: NextRequest, userContext) => {
    try {
      const body = await request.json()
      const { lawFirmId, userId, reason, ticketNumber } = body

      // Validate required fields
      if (!lawFirmId || !userId || !reason) {
        return NextResponse.json(
          { error: 'Missing required fields: lawFirmId, userId, reason' },
          { status: 400 }
        )
      }

      // Verify the target user exists and is active
      const targetUser = await prisma.users.findFirst({
        where: {
          id: userId,
          law_firm_id: lawFirmId,
          isActive: true,
        },
        include: {
          law_firms: {
            select: {
              name: true,
              isActive: true,
            },
          },
          platform_users: {
            select: {
              email: true,
              name: true,
            },
          },
          user_roles: {
            include: {
              roles: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })

      if (!targetUser || !targetUser.law_firms.isActive) {
        return NextResponse.json(
          { error: 'Target user or law firm not found or inactive' },
          { status: 404 }
        )
      }

      // Create audit log entry for impersonation start
      await prisma.$executeRaw`
      INSERT INTO platform_audit_logs (
        platform_user_id,
        law_firm_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        user_agent
      ) VALUES (
        ${userContext.id}::uuid,
        ${lawFirmId}::uuid,
        'IMPERSONATION_START',
        'user',
        ${userId}::uuid,
        NULL,
        ${JSON.stringify({
          reason,
          ticketNumber,
          targetUser: {
            email: targetUser.platform_users.email,
            name: targetUser.platform_users.name,
          },
        })}::jsonb,
        ${request.headers.get('x-forwarded-for') || 'unknown'}::inet,
        ${request.headers.get('user-agent') || 'unknown'}
      )
    `

      // Get the primary role for the target user
      const primaryRole = targetUser.user_roles[0]?.roles?.name || 'client'

      // Generate impersonation token
      const impersonationToken = generateToken({
        userId: targetUser.id,
        platformUserId: targetUser.platform_user_id,
        lawFirmId: targetUser.law_firm_id,
        role: primaryRole.toLowerCase(),
        isImpersonating: true,
        originalAdminId: userContext.id,
        impersonationReason: reason,
      })

      return NextResponse.json({
        message: 'Impersonation session started',
        impersonationToken,
        targetUser: {
          id: targetUser.id,
          email: targetUser.platform_users.email,
          name: targetUser.platform_users.name,
          role: primaryRole,
        },
        lawFirm: {
          id: targetUser.law_firm_id,
          name: targetUser.law_firms.name,
        },
        impersonationDetails: {
          reason,
          ticketNumber,
          startedAt: new Date().toISOString(),
          adminId: userContext.id,
        },
      })
    } catch (error) {
      console.error('Error starting impersonation:', error)
      return NextResponse.json(
        { error: 'Failed to start impersonation session' },
        { status: 500 }
      )
    }
  }
)

// DELETE /api/admin/impersonate - End impersonation session
export const DELETE = withRole(
  ROLES.SUPER_ADMIN,
  async (request: NextRequest, userContext) => {
    try {
      const body = await request.json()
      const { lawFirmId, userId, sessionDuration } = body

      // Create audit log entry for impersonation end
      await prisma.$executeRaw`
      INSERT INTO platform_audit_logs (
        platform_user_id,
        law_firm_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        user_agent
      ) VALUES (
        ${userContext.id}::uuid,
        ${lawFirmId}::uuid,
        'IMPERSONATION_END',
        'user',
        ${userId}::uuid,
        NULL,
        ${JSON.stringify({
          sessionDuration,
          endedAt: new Date().toISOString(),
        })}::jsonb,
        ${request.headers.get('x-forwarded-for') || 'unknown'}::inet,
        ${request.headers.get('user-agent') || 'unknown'}
      )
    `

      return NextResponse.json({
        message: 'Impersonation session ended',
        endedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error ending impersonation:', error)
      return NextResponse.json(
        { error: 'Failed to end impersonation session' },
        { status: 500 }
      )
    }
  }
)
