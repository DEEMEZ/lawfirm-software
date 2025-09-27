'use client'

import { User } from '@/types/user'
import { useState } from 'react'
import FileUpload from './FileUpload'
import FileList from './FileList'
import {
  Scale,
  Users,
  FileText,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  Activity,
  DollarSign,
  LogOut,
  User as UserIcon,
  Bell,
  Settings,
  ChevronDown,
} from 'lucide-react'

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

  // Mock data for dashboard metrics
  const stats = [
    {
      title: 'Active Cases',
      value: '24',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Scale,
      description: 'from last month',
    },
    {
      title: 'Total Clients',
      value: '156',
      change: '+8%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'from last month',
    },
    {
      title: 'Documents',
      value: '1,247',
      change: '+23%',
      changeType: 'positive' as const,
      icon: FileText,
      description: 'from last month',
    },
    {
      title: 'Revenue',
      value: '$45,200',
      change: '+15%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'from last month',
    },
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'case',
      message: 'New case &quot;Smith vs. Johnson&quot; assigned to you',
      time: '2 hours ago',
      icon: Scale,
      color: 'blue',
    },
    {
      id: 2,
      type: 'client',
      message: 'Client meeting scheduled for tomorrow',
      time: '4 hours ago',
      icon: Calendar,
      color: 'green',
    },
    {
      id: 3,
      type: 'document',
      message: 'Document &quot;Contract_Draft.pdf&quot; uploaded',
      time: '6 hours ago',
      icon: FileText,
      color: 'purple',
    },
    {
      id: 4,
      type: 'deadline',
      message: 'Deadline reminder: Motion due in 3 days',
      time: '1 day ago',
      icon: AlertCircle,
      color: 'orange',
    },
  ]

  const quickActions = [
    {
      title: 'New Case',
      description: 'Create a new case',
      icon: Scale,
      color: 'blue',
      href: '/cases/new',
    },
    {
      title: 'Add Client',
      description: 'Register new client',
      icon: Users,
      color: 'green',
      href: '/clients/new',
    },
    {
      title: 'Schedule Meeting',
      description: 'Book appointment',
      icon: Calendar,
      color: 'purple',
      href: '/calendar/new',
    },
    {
      title: 'Upload Document',
      description: 'Add new document',
      icon: FileText,
      color: 'orange',
      href: '#documents',
    },
  ]

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
                    {user.lawFirmName || 'Law Firm'}
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
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role?.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={() => {
                  window.location.href =
                    '/api/auth/signout?callbackUrl=/auth/login'
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

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user.name?.split(' ')[0] || 'User'}! 👋
                </h1>
                <p className="text-gray-600 text-lg">
                  Here&apos;s what&apos;s happening with your law firm today.
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Activity className="h-4 w-4" />
                  <span>Last login: Today at 9:30 AM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 text-sm font-medium">
                    {stat.change}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">
                    {stat.description}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Quick Actions
              </h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="group p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                      <action.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {action.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-gray-600" />
                    Recent Activity
                  </h2>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {recentActivities.map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <activity.icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Deadlines */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                  Upcoming Deadlines
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Motion Filing
                      </p>
                      <p className="text-xs text-gray-600">Smith vs. Johnson</p>
                    </div>
                    <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      3 days
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Client Meeting
                      </p>
                      <p className="text-xs text-gray-600">ABC Corporation</p>
                    </div>
                    <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                      5 days
                    </span>
                  </div>
                </div>
              </div>

              {/* Case Status */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                  Case Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Cases</span>
                    <span className="text-sm font-medium text-gray-900">
                      18
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Pending Review
                    </span>
                    <span className="text-sm font-medium text-gray-900">6</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-gray-900">
                      142
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Management Section */}
          <div
            id="documents"
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-gray-600" />
                    Document Management
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload and manage your law firm documents securely
                  </p>
                </div>
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
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
      </main>
    </div>
  )
}
