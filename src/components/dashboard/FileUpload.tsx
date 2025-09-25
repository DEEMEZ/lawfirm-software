'use client'

import React, { useState, useCallback } from 'react'

interface FileUploadProps {
  onUploadComplete?: (fileKey: string, fileName: string) => void
  onUploadError?: (error: string) => void
  maxFileSize?: number
  acceptedTypes?: string[]
  className?: string
}

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export default function FileUpload({
  onUploadComplete,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
  className = '',
}: FileUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`
    }

    if (!acceptedTypes.includes(file.type)) {
      return 'File type not supported'
    }

    return null
  }

  const uploadFile = async (file: File): Promise<void> => {
    // Add to upload list
    setUploads(prev => [
      ...prev,
      {
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      },
    ])

    try {
      // Create FormData for server-side upload
      const formData = new FormData()
      formData.append('file', file)

      console.log('Uploading file to server:', file.name)

      // Upload via server (bypasses CORS issues)
      const uploadResponse = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        console.error('Upload response error:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error: error,
        })
        throw new Error(
          error.error || `Upload failed: ${uploadResponse.status}`
        )
      }

      const result = await uploadResponse.json()

      // Update progress to completed
      setUploads(prev =>
        prev.map(upload =>
          upload.fileName === file.name
            ? { ...upload, progress: 100, status: 'completed' }
            : upload
        )
      )

      // Call success callback
      if (onUploadComplete) {
        onUploadComplete(result.file.key, file.name)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed'

      console.error('Upload error details:', error)

      // Update upload status to error
      setUploads(prev =>
        prev.map(upload =>
          upload.fileName === file.name
            ? { ...upload, status: 'error', error: errorMessage }
            : upload
        )
      )

      if (onUploadError) {
        onUploadError(errorMessage)
      }
    }
  }

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const validationError = validateFile(file)
        if (validationError) {
          if (onUploadError) {
            onUploadError(`${file.name}: ${validationError}`)
          }
          continue
        }

        await uploadFile(file)
      }
    },
    [
      maxFileSize,
      acceptedTypes,
      onUploadComplete,
      onUploadError,
      validateFile,
      uploadFile,
    ]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      handleFileSelect(files)
    },
    [handleFileSelect]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files)
        handleFileSelect(files)
      }
    },
    [handleFileSelect]
  )

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              Drag and drop files here
            </p>
            <p className="text-sm text-gray-500">or click to browse files</p>
          </div>

          <input
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            id="file-upload"
          />

          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
          >
            Select Files
          </label>

          <p className="text-xs text-gray-500">
            Supported: PDF, DOC, DOCX, TXT, JPG, PNG, GIF (max{' '}
            {Math.round(maxFileSize / (1024 * 1024))}MB)
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-900">File Uploads</h4>
            {uploads.some(u => u.status === 'completed') && (
              <button
                onClick={clearCompleted}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear completed
              </button>
            )}
          </div>

          {uploads.map((upload, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {upload.fileName}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    upload.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : upload.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {upload.status === 'completed'
                    ? 'Complete'
                    : upload.status === 'error'
                      ? 'Error'
                      : 'Uploading'}
                </span>
              </div>

              {upload.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}

              {upload.error && (
                <p className="text-xs text-red-600 mt-1">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
