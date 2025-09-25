'use client'

import React, { useState, useEffect } from 'react'

interface FileItem {
  id: string
  key: string
  fileName: string
  description?: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  uploadedBy: string
  caseTitle?: string
  clientName?: string
}

interface FileListProps {
  refreshTrigger?: number
  className?: string
}

export default function FileList({
  refreshTrigger,
  className = '',
}: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFiles = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/documents')

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`)
      }

      const data = await response.json()
      setFiles(data.documents || [])
    } catch (err) {
      console.error('Error loading files:', err)
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [refreshTrigger])

  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      // This would call the download endpoint
      const response = await fetch(
        `/api/documents/download/${encodeURIComponent(fileKey)}`
      )

      if (!response.ok) {
        throw new Error('Failed to generate download link')
      }

      const result = await response.json()
      const downloadUrl = result.download?.downloadUrl

      if (!downloadUrl) {
        throw new Error('No download URL received from server')
      }

      // Open download link
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      link.click()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed')
    }
  }

  const handleDelete = async (fileId: string, fileName: string) => {
    // Confirm deletion
    if (
      !confirm(
        `Are you sure you want to delete "${fileName}"? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/documents?id=${fileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete document')
      }

      const result = await response.json()
      console.log('🗑️ Delete response:', result)

      // Refresh the file list
      loadFiles()

      // Show success message
      alert(`"${fileName}" has been deleted successfully`)
    } catch (err) {
      console.error('Delete error:', err)
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType === 'text/plain') return '📄'
    return '📎'
  }

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center p-8`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading files...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`${className} bg-red-50 border border-red-200 rounded-lg p-4`}
      >
        <div className="flex">
          <div className="text-red-400">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">Error loading files: {error}</p>
            <button
              onClick={loadFiles}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div
        className={`${className} text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200`}
      >
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No files uploaded
        </h3>
        <p className="text-sm text-gray-500">
          Start by uploading documents using the upload area above
        </p>
      </div>
    )
  }

  return (
    <div className={`${className} space-y-2`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Uploaded Files</h3>
        <button
          onClick={loadFiles}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {files.map(file => (
            <div
              key={file.key}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="text-2xl mr-3">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.fileName}
                    </p>
                    {file.description && (
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {file.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>
                        Uploaded{' '}
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                      {file.caseTitle && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">
                            Case: {file.caseTitle}
                          </span>
                        </>
                      )}
                      {file.clientName && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">
                            Client: {file.clientName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleDownload(file.key, file.fileName)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(file.id, file.fileName)}
                    className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
