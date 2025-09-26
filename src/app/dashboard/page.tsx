'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import Dashboard from '@/components/dashboard/Dashboard'
import { User } from '@/types/user'
import {
  LogOut,
  User as UserIcon,
  Bell,
  Settings,
  ChevronDown,
  Scale,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [userContext, setUserContext] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    console.log('🏠 Dashboard: Session check', {
      session: !!session,
      role: session?.user?.role,
    })

    if (!session) {
      console.log('❌ Dashboard: No session, redirecting to login')
      redirect('/auth/login')
      return
    }

    // Check if user is super admin (should redirect to /admin)
    if (session.user?.role === 'super_admin') {
      console.log('🔄 Dashboard: Super admin detected, redirecting to /admin')
      redirect('/admin')
      return
    }

    console.log('✅ Dashboard: Law firm user authenticated, loading dashboard')
    // For law firm users, we have enough info from session
    setUserContext({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      lawFirmId: session.user.lawFirmId,
      lawFirmName: session.user.lawFirmName,
      platformUserId: session.user.platformUserId,
    })
    setLoading(false)
  }, [session, status])

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!userContext) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Loading Dashboard...
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Brand and title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {userContext.lawFirmName || 'Law Firm'}
                  </h1>
                  <p className="text-xs text-gray-500">Management Dashboard</p>
                </div>
              </div>
            </div>

            {/* Right side - Actions and user menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>

              {/* User Menu */}
              <div className="relative flex items-center space-x-3">
                <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {userContext.name || userContext.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {userContext.role?.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={() => {
                  window.location.href = '/api/auth/signout'
                }}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <Dashboard user={userContext} />
    </div>
  )
}
