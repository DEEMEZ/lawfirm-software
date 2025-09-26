// Super Admin Dashboard Component
// Purpose: Overview dashboard for platform administrators

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  Users,
  FileText,
  HardDrive,
  Shield,
  BarChart3,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Key,
  ArrowRight,
  Calendar,
  Database,
} from 'lucide-react'

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
        credentials: 'include',
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      } else {
        console.error('Stats API error:', await statsResponse.text())
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/admin/dashboard/activity', {
        credentials: 'include',
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
      case 'signup':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'suspension':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'activation':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'impersonation':
        return <Key className="h-4 w-4 text-blue-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
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
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-8 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-slate-300 mt-1">
              Platform Overview & Management
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/firms"
          className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Manage Law Firms
                </h3>
                <p className="text-gray-600 text-sm">
                  Create, suspend, and monitor firms
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>

        <Link
          href="/admin/audit"
          className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-amber-300 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                <Shield className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Audit Logs
                </h3>
                <p className="text-gray-600 text-sm">
                  Monitor platform activities
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
          </div>
        </Link>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gray-50 text-gray-400">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Analytics
                </h3>
                <p className="text-gray-500 text-sm">Coming soon...</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
              Soon
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Law Firms
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalLawFirms}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">
                {stats.activeLawFirms} active
              </span>
              <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md">
                {stats.suspendedLawFirms} suspended
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-sm">
              <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">
                {stats.activeUsers} active users
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalCases}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Across all law firms
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Storage Usage
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.storageUsage.percentage}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <HardDrive className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  {(stats.storageUsage.used / (1024 * 1024 * 1024)).toFixed(2)}{' '}
                  GB used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.storageUsage.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
            </div>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium">
                        {activity.message}
                      </p>
                      {activity.lawFirmName && (
                        <p className="text-xs text-blue-600 mt-1">
                          @ {activity.lawFirmName}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href="/admin/audit"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all activity
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Stats
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">
                    New signups (30 days)
                  </span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {stats?.recentSignups || 0}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Active law firms
                  </span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {stats?.activeLawFirms || 0}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Total documents
                  </span>
                </div>
                <span className="text-lg font-bold text-purple-600">
                  {stats?.totalDocuments || 0}
                </span>
              </div>

              {stats?.storageUsage && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-3">
                      <HardDrive className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Storage usage
                      </span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      {stats.storageUsage.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.storageUsage.percentage}%` }}
                    />
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
