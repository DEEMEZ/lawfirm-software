// Super-Admin Layout
// Purpose: Layout for admin pages with navigation and authorization

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Sidebar } from '@/components/Global/Sidebar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Check if user is super admin
    // This is a simplified check - in production you'd validate the JWT token
    const checkAuth = async () => {
      try {
        // Get current user context
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const user = await response.json()
          if (user.role === 'super_admin') {
            setIsAuthorized(true)
          } else {
            router.push('/')
          }
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Modern Collapsible Sidebar */}
      <Sidebar userRole="super_admin" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm h-[73px]">
          <div className="px-6 h-full">
            <div className="flex justify-between items-center h-full">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900 lg:ml-0 ml-12">
                  Super Admin Console
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Platform Administrator
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
