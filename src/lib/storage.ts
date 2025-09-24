// Object Storage Service (R2/S3-compatible)
// Purpose: Store documents with presigned URLs and tenant isolation

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env'

// Storage configuration
export interface StorageConfig {
  accessKeyId: string
  secretAccessKey: string
  endpoint: string
  region: string
  bucket: string
}

// File metadata
export interface FileMetadata {
  key: string
  lawFirmId: string
  caseId?: string
  clientId?: string
  uploadedBy: string
  fileName: string
  fileSize: number
  mimeType: string
  checksum?: string
}

// Upload options
export interface UploadOptions {
  lawFirmId: string
  folder: 'documents' | 'cases' | 'users' | 'templates'
  fileName: string
  mimeType: string
  fileSize: number
  uploadedBy: string
  caseId?: string
  clientId?: string
  expiresIn?: number // Presigned URL expiration in seconds (default: 3600)
}

// Download options
export interface DownloadOptions {
  key: string
  lawFirmId: string
  expiresIn?: number // Presigned URL expiration in seconds (default: 3600)
  responseContentDisposition?: string // For setting download filename
}

// Storage result types
export interface UploadResult {
  key: string
  uploadUrl: string
  metadata: FileMetadata
  expiresAt: Date
}

export interface DownloadResult {
  downloadUrl: string
  metadata: FileMetadata
  expiresAt: Date
}

// Object storage service class
export class StorageService {
  private static instance: StorageService
  private s3Client: S3Client
  private bucket: string

  private constructor() {
    // Initialize S3-compatible client for Cloudflare R2
    const config: StorageConfig = {
      accessKeyId: env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
      endpoint: env.R2_ENDPOINT || '',
      region: 'auto', // R2 uses 'auto' region
      bucket: env.R2_BUCKET_NAME || '',
    }

    this.bucket = config.bucket

    this.s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Required for R2
    })
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  // Generate presigned upload URL
  async generateUploadUrl(options: UploadOptions): Promise<UploadResult> {
    try {
      // Generate secure file key with tenant isolation
      const key = this.generateFileKey(
        options.lawFirmId,
        options.folder,
        options.fileName,
        options.caseId
      )

      // Create metadata
      const metadata: FileMetadata = {
        key,
        lawFirmId: options.lawFirmId,
        caseId: options.caseId,
        clientId: options.clientId,
        uploadedBy: options.uploadedBy,
        fileName: options.fileName,
        fileSize: options.fileSize,
        mimeType: options.mimeType,
      }

      // Create presigned PUT URL
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: options.mimeType,
        ContentLength: options.fileSize,
        Metadata: {
          lawFirmId: options.lawFirmId,
          uploadedBy: options.uploadedBy,
          fileName: options.fileName,
          ...(options.caseId && { caseId: options.caseId }),
          ...(options.clientId && { clientId: options.clientId }),
        },
      })

      const expiresIn = options.expiresIn || 3600 // 1 hour default
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      })

      return {
        key,
        uploadUrl,
        metadata,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      }
    } catch (error) {
      console.error('Error generating upload URL:', error)
      throw new Error('Failed to generate upload URL')
    }
  }

  // Generate presigned download URL
  async generateDownloadUrl(options: DownloadOptions): Promise<DownloadResult> {
    try {
      // Verify file exists and check tenant access
      await this.verifyFileAccess(options.key, options.lawFirmId)

      // Get file metadata
      const metadata = await this.getFileMetadata(options.key)

      // Create presigned GET URL
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: options.key,
        ResponseContentDisposition: options.responseContentDisposition,
      })

      const expiresIn = options.expiresIn || 3600 // 1 hour default
      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      })

      return {
        downloadUrl,
        metadata,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      }
    } catch (error) {
      console.error('Error generating download URL:', error)
      throw new Error('Failed to generate download URL')
    }
  }

  // Delete file
  async deleteFile(key: string, lawFirmId: string): Promise<void> {
    try {
      // Verify file exists and check tenant access
      await this.verifyFileAccess(key, lawFirmId)

      // Delete the file
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.s3Client.send(command)
      console.log(`File deleted successfully: ${key}`)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw new Error('Failed to delete file')
    }
  }

  // Get file metadata
  async getFileMetadata(key: string): Promise<FileMetadata> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const response = await this.s3Client.send(command)

      return {
        key,
        lawFirmId: response.Metadata?.lawfirmid || '',
        caseId: response.Metadata?.caseid,
        clientId: response.Metadata?.clientid,
        uploadedBy: response.Metadata?.uploadedby || '',
        fileName: response.Metadata?.filename || '',
        fileSize: response.ContentLength || 0,
        mimeType: response.ContentType || 'application/octet-stream',
      }
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw new Error('File not found or inaccessible')
    }
  }

  // Verify file access (tenant isolation)
  private async verifyFileAccess(
    key: string,
    lawFirmId: string
  ): Promise<void> {
    try {
      const metadata = await this.getFileMetadata(key)

      if (metadata.lawFirmId !== lawFirmId) {
        throw new Error('Access denied: File belongs to different law firm')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        throw error
      }
      throw new Error('File not found or inaccessible')
    }
  }

  // Generate secure file key with tenant isolation
  private generateFileKey(
    lawFirmId: string,
    folder: string,
    fileName: string,
    caseId?: string
  ): string {
    // Create timestamp for uniqueness
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)

    // Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')

    // Build key with tenant isolation
    let key = `${lawFirmId}/${folder}`

    if (caseId) {
      key += `/${caseId}`
    }

    key += `/${timestamp}_${randomId}_${sanitizedFileName}`

    return key
  }

  // Check if storage is configured
  isConfigured(): boolean {
    return !!(
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_ENDPOINT &&
      env.R2_BUCKET_NAME
    )
  }

  // Test storage configuration
  async testConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error:
            'Storage not configured. Missing required environment variables.',
        }
      }

      // Try to list objects to test connection
      const testKey = `test/${Date.now()}_config_test.txt`
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: testKey,
      })

      try {
        await this.s3Client.send(command)
      } catch (error: unknown) {
        // If file doesn't exist, that's fine - it means we can connect
        if (
          (error as { name?: string }).name === 'NotFound' ||
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode === 404
        ) {
          return { success: true }
        }
        throw error
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Storage utility functions
export const storageService = StorageService.getInstance()

// Quick functions for common operations
export async function createUploadUrl(
  options: UploadOptions
): Promise<UploadResult> {
  return storageService.generateUploadUrl(options)
}

export async function createDownloadUrl(
  options: DownloadOptions
): Promise<DownloadResult> {
  return storageService.generateDownloadUrl(options)
}

export async function deleteStorageFile(
  key: string,
  lawFirmId: string
): Promise<void> {
  return storageService.deleteFile(key, lawFirmId)
}

// Storage path helpers
export class StoragePaths {
  static documents(lawFirmId: string, caseId?: string): string {
    return caseId
      ? `${lawFirmId}/documents/${caseId}`
      : `${lawFirmId}/documents`
  }

  static users(lawFirmId: string, userId?: string): string {
    return userId ? `${lawFirmId}/users/${userId}` : `${lawFirmId}/users`
  }

  static templates(lawFirmId: string): string {
    return `${lawFirmId}/templates`
  }

  static cases(lawFirmId: string, caseId: string): string {
    return `${lawFirmId}/cases/${caseId}`
  }
}

// File type validation
export class FileValidation {
  static readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
  ]

  static readonly MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

  static isAllowedDocumentType(mimeType: string): boolean {
    return this.ALLOWED_DOCUMENT_TYPES.includes(mimeType)
  }

  static isValidFileSize(size: number): boolean {
    return size > 0 && size <= this.MAX_FILE_SIZE
  }

  static validateFile(
    fileName: string,
    mimeType: string,
    size: number
  ): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!fileName || fileName.trim().length === 0) {
      errors.push('File name is required')
    }

    if (!this.isAllowedDocumentType(mimeType)) {
      errors.push('File type not allowed')
    }

    if (!this.isValidFileSize(size)) {
      errors.push(
        `File size must be between 1 byte and ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
