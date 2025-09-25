// Super-Admin Layout
// Purpose: Layout for admin pages with navigation and authorization

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">⚡ Super Admin Console</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">Platform Administrator</span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  📊 Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/firms"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  🏢 Law Firms
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/audit"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  📋 Audit Logs
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/analytics"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  📊 Analytics
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/settings"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  ⚙️ Platform Settings
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
