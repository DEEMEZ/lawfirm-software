// Document Download API
// Purpose: Generate presigned URLs for secure document downloads

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-guards'
import { createDownloadUrl } from '@/lib/storage'
import { PERMISSIONS } from '@/lib/rbac'
import { requirePermission } from '@/lib/rbac'

interface RouteParams {
  params: { key: string }
}

// GET /api/documents/download/[key] - Generate presigned download URL
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (request: NextRequest, userContext) => {
    try {
      // Check permissions
      requirePermission(userContext, PERMISSIONS.DOCUMENTS.VIEW)

      const { searchParams } = new URL(request.url)
      const download = searchParams.get('download') === 'true'
      const fileName = searchParams.get('fileName')

      // Decode the key (it might be URL encoded)
      const key = decodeURIComponent(params.key)

      // Validate key format (should start with law firm ID)
      if (!key.startsWith(userContext.lawFirmId)) {
        return NextResponse.json(
          { error: 'Invalid document key' },
          { status: 403 }
        )
      }

      // Generate download URL
      const downloadResult = await createDownloadUrl({
        key,
        lawFirmId: userContext.lawFirmId,
        expiresIn: 3600, // 1 hour
        responseContentDisposition: download && fileName
          ? `attachment; filename="${fileName}"`
          : undefined
      })

      return NextResponse.json({
        message: 'Download URL generated successfully',
        download: {
          downloadUrl: downloadResult.downloadUrl,
          expiresAt: downloadResult.expiresAt.toISOString()
        },
        metadata: downloadResult.metadata,
        instructions: {
          method: 'GET',
          note: 'Use the downloadUrl to download the file. URL expires in 1 hour.'
        }
      })

    } catch (error) {
      console.error('Error generating download URL:', error)

      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('Access denied')) {
          return NextResponse.json(
            { error: 'Access denied to this document' },
            { status: 403 }
          )
        }
        if (error.message.includes('not found')) {
          return NextResponse.json(
            { error: 'Document not found' },
            { status: 404 }
          )
        }
      }

      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }
  })(request)
}