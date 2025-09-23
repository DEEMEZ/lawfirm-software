// Super-Admin Audit Logs API
// Purpose: View platform-wide audit logs with filtering

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/auth-guards'
import { ROLES } from '@/lib/rbac'

// GET /api/admin/audit - Get platform audit logs
export const GET = withRole(ROLES.SUPER_ADMIN, async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const lawFirmId = searchParams.get('lawFirmId')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (lawFirmId) {
      where.law_firm_id = lawFirmId
    }

    if (action) {
      where.action = action
    }

    if (entityType) {
      where.entity_type = entityType
    }

    if (startDate || endDate) {
      where.created_at = {}
      if (startDate) {
        where.created_at.gte = new Date(startDate)
      }
      if (endDate) {
        where.created_at.lte = new Date(endDate)
      }
    }

    // Get audit logs using raw query for platform_audit_logs table
    const auditLogs = await prisma.$queryRaw`
      SELECT
        pal.id,
        pal.platform_user_id,
        pal.law_firm_id,
        pal.action,
        pal.entity_type,
        pal.entity_id,
        pal.old_values,
        pal.new_values,
        pal.ip_address,
        pal.user_agent,
        pal.created_at,
        pu.email as admin_email,
        pu.name as admin_name,
        lf.name as law_firm_name
      FROM platform_audit_logs pal
      LEFT JOIN platform_users pu ON pal.platform_user_id = pu.id
      LEFT JOIN law_firms lf ON pal.law_firm_id = lf.id
      WHERE (${lawFirmId}::uuid IS NULL OR pal.law_firm_id = ${lawFirmId}::uuid)
        AND (${action}::text IS NULL OR pal.action = ${action})
        AND (${entityType}::text IS NULL OR pal.entity_type = ${entityType})
        AND (${startDate}::timestamp IS NULL OR pal.created_at >= ${startDate}::timestamp)
        AND (${endDate}::timestamp IS NULL OR pal.created_at <= ${endDate}::timestamp)
      ORDER BY pal.created_at DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `

    // Get total count
    const totalCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM platform_audit_logs pal
      WHERE (${lawFirmId}::uuid IS NULL OR pal.law_firm_id = ${lawFirmId}::uuid)
        AND (${action}::text IS NULL OR pal.action = ${action})
        AND (${entityType}::text IS NULL OR pal.entity_type = ${entityType})
        AND (${startDate}::timestamp IS NULL OR pal.created_at >= ${startDate}::timestamp)
        AND (${endDate}::timestamp IS NULL OR pal.created_at <= ${endDate}::timestamp)
    ` as any[]

    const total = Number(totalCount[0]?.count || 0)

    return NextResponse.json({
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
})