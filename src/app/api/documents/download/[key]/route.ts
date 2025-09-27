// Document Download API (Fixed)
// Purpose: Generate presigned URLs for secure document downloads

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-guards'
import { PERMISSIONS } from '@/lib/rbac'
import { requirePermission } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ key: string }>
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
      const { key: rawKey } = await params
      const key = decodeURIComponent(rawKey)

      // Find document in database to verify access
      const document = await prisma.documents.findFirst({
        where: {
          file_path: key, // file_path stores the R2 key
          law_firm_id: userContext.lawFirmId,
        },
        select: {
          id: true,
          name: true,
          file_path: true,
          law_firm_id: true,
        },
      })

      if (!document) {
        return NextResponse.json(
          { error: 'Document not found or access denied' },
          { status: 404 }
        )
      }

      // Create a proper presigned download URL using AWS SDK
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

      // Create S3 client with same config as storage service
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true, // Required for R2
      })

      const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: document.file_path,
        ResponseContentDisposition:
          download && fileName
            ? `attachment; filename="${fileName || document.name}"`
            : undefined,
      })

      const downloadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // 1 hour
      })

      return NextResponse.json({
        message: 'Download URL generated successfully',
        download: {
          downloadUrl: downloadUrl,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
        metadata: {
          fileName: document.name,
          key: document.file_path,
        },
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
