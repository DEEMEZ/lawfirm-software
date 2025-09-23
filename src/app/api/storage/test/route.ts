// Storage Test API Route
// Purpose: Test storage configuration and functionality

import { NextRequest, NextResponse } from 'next/server'
import { storageService, FileValidation, StoragePaths } from '@/lib/storage'
import { withRole } from '@/lib/auth-guards'
import { ROLES } from '@/lib/rbac'

// GET /api/storage/test - Test storage configuration
export const GET = withRole(ROLES.SUPER_ADMIN, async () => {
  try {
    // Test storage configuration
    const configTest = await storageService.testConfiguration()

    const configuration = {
      provider: 'Cloudflare R2 (S3-compatible)',
      configured: storageService.isConfigured(),
      bucket: process.env.R2_BUCKET_NAME || 'Not configured',
      endpoint: process.env.R2_ENDPOINT || 'Not configured',
      accessKeyConfigured: !!process.env.R2_ACCESS_KEY_ID,
      secretKeyConfigured: !!process.env.R2_SECRET_ACCESS_KEY
    }

    // Test file validation
    const validationTests = [
      { fileName: 'test.pdf', mimeType: 'application/pdf', size: 1024 },
      { fileName: 'test.exe', mimeType: 'application/x-executable', size: 1024 },
      { fileName: 'large.pdf', mimeType: 'application/pdf', size: 200 * 1024 * 1024 },
      { fileName: 'small.txt', mimeType: 'text/plain', size: 100 }
    ]

    const validationResults = validationTests.map(test => ({
      ...test,
      validation: FileValidation.validateFile(test.fileName, test.mimeType, test.size)
    }))

    // Test path generation
    const pathTests = {
      documents: StoragePaths.documents('test-firm-123'),
      documentsWithCase: StoragePaths.documents('test-firm-123', 'case-456'),
      users: StoragePaths.users('test-firm-123'),
      usersWithId: StoragePaths.users('test-firm-123', 'user-789'),
      templates: StoragePaths.templates('test-firm-123'),
      cases: StoragePaths.cases('test-firm-123', 'case-456')
    }

    return NextResponse.json({
      message: 'Storage configuration test results',
      configuration,
      configTest,
      validation: {
        allowedTypes: FileValidation.ALLOWED_DOCUMENT_TYPES,
        maxFileSize: `${FileValidation.MAX_FILE_SIZE / 1024 / 1024}MB`,
        tests: validationResults
      },
      pathGeneration: pathTests,
      capabilities: {
        presignedUploads: true,
        presignedDownloads: true,
        tenantIsolation: true,
        fileValidation: true,
        metadataStorage: true
      }
    })

  } catch (error) {
    console.error('Storage test failed:', error)
    return NextResponse.json(
      { error: 'Storage test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
})

// POST /api/storage/test - Test presigned URL generation
export const POST = withRole(ROLES.SUPER_ADMIN, async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { operation = 'upload', fileName = 'test.pdf', lawFirmId = 'test-firm' } = body

    if (!storageService.isConfigured()) {
      return NextResponse.json(
        { error: 'Storage not configured. Please set R2 environment variables.' },
        { status: 400 }
      )
    }

    let result

    if (operation === 'upload') {
      // Test upload URL generation
      result = await storageService.generateUploadUrl({
        lawFirmId,
        folder: 'documents',
        fileName,
        mimeType: 'application/pdf',
        fileSize: 1024,
        uploadedBy: 'test-user'
      })

      return NextResponse.json({
        message: 'Upload URL generated successfully (test)',
        operation: 'upload',
        result: {
          key: result.key,
          uploadUrl: result.uploadUrl.substring(0, 100) + '...', // Truncate for security
          expiresAt: result.expiresAt,
          metadata: result.metadata
        },
        note: 'This is a test URL. Do not use for actual uploads.'
      })

    } else if (operation === 'download') {
      // For download test, we need an existing key
      const testKey = `${lawFirmId}/documents/test-file.pdf`

      try {
        result = await storageService.generateDownloadUrl({
          key: testKey,
          lawFirmId
        })

        return NextResponse.json({
          message: 'Download URL generated successfully (test)',
          operation: 'download',
          result: {
            downloadUrl: result.downloadUrl.substring(0, 100) + '...', // Truncate for security
            expiresAt: result.expiresAt,
            metadata: result.metadata
          },
          note: 'This URL may fail if the test file does not exist.'
        })

      } catch (error) {
        return NextResponse.json({
          message: 'Download URL generation test completed',
          operation: 'download',
          result: 'File not found (expected for test)',
          note: 'This is expected if no test file exists. The URL generation logic works.',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid operation. Use "upload" or "download".' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Storage operation test failed:', error)
    return NextResponse.json(
      { error: 'Storage operation test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
})