// Server-side Upload API
// Purpose: Upload files through server to R2 (bypasses CORS issues)

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { withAuth } from '@/lib/auth-guards'
import { storageService, FileValidation } from '@/lib/storage'
import { PERMISSIONS, requirePermission } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (request: NextRequest, userContext) => {
  try {
    // Check permissions
    requirePermission(userContext, PERMISSIONS.DOCUMENTS.UPLOAD)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const validation = FileValidation.validateFile(
      file.name,
      file.type,
      file.size
    )
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'File validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Generate upload URL
    const uploadResult = await storageService.generateUploadUrl({
      lawFirmId: userContext.lawFirmId,
      folder: 'documents',
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      uploadedBy: userContext.id,
    })

    // Upload file to R2 from server
    const fileBuffer = await file.arrayBuffer()
    const uploadResponse = await fetch(uploadResult.uploadUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
      },
    })

    if (!uploadResponse.ok) {
      console.error('R2 upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
      })
      throw new Error('Failed to upload to storage')
    }

    // Save document metadata to database
    const document = await prisma.documents.create({
      data: {
        id: randomUUID(),
        law_firm_id: userContext.lawFirmId,
        name: file.name,
        description: `Uploaded via dashboard`,
        file_path: uploadResult.key, // Store the R2 key as file path
        file_size: BigInt(file.size),
        mime_type: file.type,
        uploaded_by: userContext.id,
        updatedAt: new Date(),
        // case_id and client_id can be null for general documents
      },
    })

    // Return success
    return NextResponse.json({
      message: 'File uploaded successfully',
      file: {
        id: document.id,
        key: uploadResult.key,
        fileName: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploadedAt: document.createdAt.toISOString(),
        uploaded_by: userContext.id,
      },
      metadata: uploadResult.metadata,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
})
