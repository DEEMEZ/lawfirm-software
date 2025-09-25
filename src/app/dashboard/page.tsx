'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [userContext, setUserContext] = useState(null)
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
                {session.user?.lawFirmName || 'Law Firm'} Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user?.name} ({session.user?.role})
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Your Law Firm Dashboard
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">Cases</h3>
                  <p className="text-3xl font-bold text-blue-600">0</p>
                  <p className="text-sm text-blue-700">Active cases</p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900">
                    Clients
                  </h3>
                  <p className="text-3xl font-bold text-green-600">0</p>
                  <p className="text-sm text-green-700">Total clients</p>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900">
                    Documents
                  </h3>
                  <p className="text-3xl font-bold text-purple-600">0</p>
                  <p className="text-sm text-purple-700">Total documents</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-center">
                    No recent activity. Start by creating your first case or
                    adding clients.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="flex space-x-4">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    Add New Case
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                    Add New Client
                  </button>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                    Upload Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
