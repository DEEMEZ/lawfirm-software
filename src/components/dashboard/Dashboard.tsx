'use client'

import { User } from '@/types/user'
import { useState } from 'react'
import FileUpload from './FileUpload'
import FileList from './FileList'

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadComplete = (fileKey: string, fileName: string) => {
    setRefreshTrigger(prev => prev + 1)
    console.log('File uploaded:', fileName, 'Key:', fileKey)
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
  }

  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Law Firm Management System
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Welcome back, {user.name || user.email}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 text-lg">Cases</h4>
              <p className="text-blue-700 mt-2">Manage your cases</p>
              <div className="mt-4 text-2xl font-bold text-blue-900">0</div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 text-lg">Clients</h4>
              <p className="text-green-700 mt-2">Client management</p>
              <div className="mt-4 text-2xl font-bold text-green-900">0</div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 text-lg">Documents</h4>
              <p className="text-purple-700 mt-2">Document storage</p>
              <div className="mt-4 text-2xl font-bold text-purple-900">0</div>
            </div>
          </div>

          {/* File Management Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Document Management
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload and manage your law firm documents securely
              </p>
            </div>

            <div className="px-6 py-6 space-y-8">
              {/* File Upload */}
              <FileUpload
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                className="w-full"
              />

              {/* File List */}
              <FileList refreshTrigger={refreshTrigger} className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
