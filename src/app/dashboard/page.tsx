'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import Dashboard from '@/components/dashboard/Dashboard'
import { User } from '@/types/user'

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
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {userContext.lawFirmName || 'Law Firm'} Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {userContext.name || userContext.email} ({userContext.role})
              </span>
              <button
                onClick={() => {
                  window.location.href = '/api/auth/signout'
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Use the enhanced Dashboard component with file upload */}
      <Dashboard user={userContext} />
    </div>
  )
}
