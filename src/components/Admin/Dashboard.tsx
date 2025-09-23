// Super Admin Dashboard Component
// Purpose: Overview dashboard for platform administrators

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardStats {
  totalLawFirms: number
  activeLawFirms: number
  suspendedLawFirms: number
  totalUsers: number
  activeUsers: number
  totalCases: number
  totalDocuments: number
  recentSignups: number
  storageUsage: {
    used: number
    total: number
    percentage: number
  }
}

interface RecentActivity {
  id: string
  type: 'signup' | 'suspension' | 'activation' | 'impersonation'
  message: string
  timestamp: string
  lawFirmName?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/admin/dashboard/stats', {
        credentials: 'include'
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      } else {
        console.error('Stats API error:', await statsResponse.text())
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/admin/dashboard/activity', {
        credentials: 'include'
      })
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.activities)
      } else {
        console.error('Activity API error:', await activityResponse.text())
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signup': return '🎉'
      case 'suspension': return '⚠️'
      case 'activation': return '✅'
      case 'impersonation': return '🔑'
      default: return '📝'
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-red-100 mt-2">Platform Overview & Management</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/firms"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              🏢
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Law Firms</h3>
              <p className="text-gray-600">Create, suspend, and monitor firms</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/audit"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              📋
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
              <p className="text-gray-600">Monitor platform activities</p>
            </div>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              📊
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Law Firms</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLawFirms}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                🏢
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {stats.activeLawFirms} active, {stats.suspendedLawFirms} suspended
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                👥
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {stats.activeUsers} active users
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCases}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                ⚖️
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Across all law firms
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">{stats.storageUsage.percentage}%</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                💾
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {(stats.storageUsage.used / (1024 * 1024 * 1024)).toFixed(2)} GB used
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      {activity.lawFirmName && (
                        <p className="text-xs text-blue-600">@ {activity.lawFirmName}</p>
                      )}
                      <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link
                href="/admin/audit"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all activity →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New signups (30 days)</span>
                <span className="text-sm font-semibold text-green-600">
                  {stats?.recentSignups || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active law firms</span>
                <span className="text-sm font-semibold text-blue-600">
                  {stats?.activeLawFirms || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total documents</span>
                <span className="text-sm font-semibold text-purple-600">
                  {stats?.totalDocuments || 0}
                </span>
              </div>
              {stats?.storageUsage && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Storage usage</span>
                    <span className="text-sm font-semibold text-orange-600">
                      {stats.storageUsage.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${stats.storageUsage.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}