// R2 Debug Test API
// Purpose: Test R2 connectivity and configuration

import { NextRequest, NextResponse } from 'next/server'
import { storageService } from '@/lib/storage'

export async function GET() {
  try {
    // Test storage configuration
    const isConfigured = storageService.isConfigured()
    const configTest = await storageService.testConfiguration()

    return NextResponse.json({
      success: true,
      message: 'R2 storage debug information',
      isConfigured,
      configTest,
      credentials: {
        hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
        hasBucket: !!process.env.R2_BUCKET_NAME,
        hasEndpoint: !!process.env.R2_ENDPOINT,
      },
      config: {
        bucketName: process.env.R2_BUCKET_NAME || 'Not set',
        endpoint: process.env.R2_ENDPOINT || 'Not set',
      },
    })
  } catch (error) {
    console.error('R2 test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'R2 connectivity test failed',
      },
      { status: 500 }
    )
  }
}

// Test presigned URL generation
export async function POST(request: NextRequest) {
  try {
    const { fileName = 'test.pdf' } = await request.json()

    if (!storageService.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'R2 not configured properly',
        },
        { status: 400 }
      )
    }

    // Generate a test presigned URL
    const uploadResult = await storageService.generateUploadUrl({
      lawFirmId: 'test-firm-id',
      folder: 'documents',
      fileName,
      mimeType: 'application/pdf',
      fileSize: 1024,
      uploadedBy: 'test-user',
      expiresIn: 3600,
    })

    return NextResponse.json({
      success: true,
      message: 'Presigned URL generated successfully',
      result: {
        key: uploadResult.key,
        uploadUrl: uploadResult.uploadUrl.substring(0, 120) + '...', // Truncate for security
        expiresAt: uploadResult.expiresAt,
        metadata: uploadResult.metadata,
      },
    })
  } catch (error) {
    console.error('Presigned URL generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to generate presigned URL',
      },
      { status: 500 }
    )
  }
}
