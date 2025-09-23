// Document Presigned Upload API
// Purpose: Generate presigned URLs for secure document uploads

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-guards'
import { createUploadUrl, FileValidation } from '@/lib/storage'
import { PERMISSIONS } from '@/lib/rbac'
import { requirePermission } from '@/lib/rbac'

// POST /api/documents/presign - Generate presigned upload URL
export const POST = withAuth(async (request: NextRequest, userContext) => {
  try {
    // Check permissions
    requirePermission(userContext, PERMISSIONS.DOCUMENTS.UPLOAD)

    const body = await request.json()
    const {
      fileName,
      fileSize,
      mimeType,
      caseId,
      clientId,
      folder = 'documents'
    } = body

    // Validate required fields
    if (!fileName || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileSize, mimeType' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = FileValidation.validateFile(fileName, mimeType, fileSize)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'File validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Generate upload URL
    const uploadResult = await createUploadUrl({
      lawFirmId: userContext.lawFirmId,
      folder: folder as 'documents' | 'cases' | 'users' | 'templates',
      fileName,
      mimeType,
      fileSize,
      uploadedBy: userContext.id,
      caseId,
      clientId
    })

    // Return upload details
    return NextResponse.json({
      message: 'Upload URL generated successfully',
      upload: {
        key: uploadResult.key,
        uploadUrl: uploadResult.uploadUrl,
        expiresAt: uploadResult.expiresAt.toISOString()
      },
      metadata: uploadResult.metadata,
      instructions: {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
          'Content-Length': fileSize.toString()
        },
        note: 'Upload the file using PUT request to the uploadUrl'
      }
    })

  } catch (error) {
    console.error('Error generating presigned upload URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
})