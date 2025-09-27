// Documents List API
// Purpose: List uploaded documents for the law firm

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-guards'
import { PERMISSIONS } from '@/lib/rbac'
import { requirePermission } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

// GET /api/documents - List documents
export const GET = withAuth(async (request: NextRequest, userContext) => {
  try {
    // Check permissions
    requirePermission(userContext, PERMISSIONS.DOCUMENTS.VIEW)

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const caseId = searchParams.get('caseId')
    const clientId = searchParams.get('clientId')

    // Build where clause
    const where: {
      law_firm_id: string
      case_id?: string
      client_id?: string
    } = {
      law_firm_id: userContext.lawFirmId,
    }

    if (caseId) {
      where.case_id = caseId
    }

    if (clientId) {
      where.client_id = clientId
    }

    // Query documents with pagination
    const [documents, total] = await Promise.all([
      prisma.documents.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          description: true,
          file_path: true,
          file_size: true,
          mime_type: true,
          uploaded_by: true,
          createdAt: true,
          updatedAt: true,
          case_id: true,
          client_id: true,
          cases: {
            select: {
              title: true,
            },
          },
          clients: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
      prisma.documents.count({ where }),
    ])

    // Format response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      fileName: doc.name,
      description: doc.description,
      key: doc.file_path, // R2 key
      fileSize: Number(doc.file_size), // Convert BigInt to number
      mimeType: doc.mime_type,
      uploadedBy: doc.uploaded_by,
      uploadedAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      caseId: doc.case_id,
      clientId: doc.client_id,
      caseTitle: doc.cases?.title,
      clientName: doc.clients
        ? `${doc.clients.first_name} ${doc.clients.last_name}`
        : null,
    }))

    return NextResponse.json({
      message: 'Documents retrieved successfully',
      documents: formattedDocuments,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error retrieving documents:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 }
    )
  }
})

// DELETE /api/documents?id=documentId - Delete document
export const DELETE = withAuth(async (request: NextRequest, userContext) => {
  try {
    // Check permissions
    requirePermission(userContext, PERMISSIONS.DOCUMENTS.DELETE)

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Find document to verify access and get file path
    const document = await prisma.documents.findFirst({
      where: {
        id: documentId,
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

    // Delete from R2 storage
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3')

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    })

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: document.file_path,
    })

    await s3Client.send(deleteCommand)

    // Delete from database
    await prisma.documents.delete({
      where: {
        id: documentId,
      },
    })

    return NextResponse.json({
      message: 'Document deleted successfully',
      deletedDocument: {
        id: document.id,
        name: document.name,
      },
    })
  } catch (error) {
    console.error('Error deleting document:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Document not found in storage' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
})
