// Super-Admin Law Firms Management Component
// Purpose: List, create, and manage law firms

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  FileText,
  Eye,
  Power,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Crown,
  Globe,
  Mail,
  Lock,
  User,
} from 'lucide-react'

interface LawFirm {
  id: string
  name: string
  slug: string
  domain?: string
  plan: string
  isActive: boolean
  createdAt: string
  stats: {
    totalUsers: number
    activeUsers: number
    totalCases: number
    activeCases: number
    totalDocuments: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function FirmsManagement() {
  const [firms, setFirms] = useState<LawFirm[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchFirms = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/firms?${params}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setFirms(data.firms)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching firms:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, statusFilter])

  useEffect(() => {
    fetchFirms()
  }, [fetchFirms])

  const handleCreateFirm = async (formData: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/admin/firms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      })

      if (response.ok) {
        setShowCreateModal(false)
        fetchFirms()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating firm:', error)
      alert('Failed to create law firm')
    }
  }

  const toggleFirmStatus = async (firmId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/firms/${firmId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
        credentials: 'include',
      })

      if (response.ok) {
        fetchFirms()
      }
    } catch (error) {
      console.error('Error updating firm status:', error)
    }
  }

  const deleteFirm = async (firmId: string, firmName: string) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${firmName}"?\n\n` +
        'This will delete:\n' +
        '• All users and their data\n' +
        '• All cases and documents\n' +
        '• All roles and permissions\n\n' +
        'This action CANNOT be undone!'
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/firms/${firmId}?action=delete`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        fetchFirms()
        alert('Law firm deleted successfully')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting firm:', error)
      alert('Failed to delete law firm')
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Law Firms Management
            </h1>
            <p className="text-gray-600 text-sm">
              Manage and monitor all law firms on the platform
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors duration-200 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Law Firm
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search law firms..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-colors"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Firms Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Building2 className="h-4 w-4" />
                    <span>Law Firm</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Crown className="h-4 w-4" />
                    <span>Plan</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>Users</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>Cases</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {firms.map(firm => (
                <tr
                  key={firm.id}
                  className="hover:bg-gray-50/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {firm.name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {firm.slug}
                          </span>
                          {firm.domain && (
                            <>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Globe className="h-3 w-3" />
                                <span>{firm.domain}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                        firm.plan === 'ENTERPRISE'
                          ? 'bg-purple-100 text-purple-800'
                          : firm.plan === 'PROFESSIONAL'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {firm.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900">
                        {firm.stats.activeUsers}
                      </div>
                      <div className="text-xs text-gray-500">
                        of {firm.stats.totalUsers}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${firm.stats.totalUsers > 0 ? (firm.stats.activeUsers / firm.stats.totalUsers) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900">
                        {firm.stats.activeCases}
                      </div>
                      <div className="text-xs text-gray-500">
                        of {firm.stats.totalCases}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${firm.stats.totalCases > 0 ? (firm.stats.activeCases / firm.stats.totalCases) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${firm.isActive ? 'bg-green-400' : 'bg-red-400'}`}
                      />
                      <span
                        className={`text-sm font-medium ${firm.isActive ? 'text-green-700' : 'text-red-700'}`}
                      >
                        {firm.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/firms/${firm.id}`}
                        className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => toggleFirmStatus(firm.id, firm.isActive)}
                        className={`inline-flex items-center p-2 rounded-lg transition-all duration-150 ${
                          firm.isActive
                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={firm.isActive ? 'Suspend Firm' : 'Activate Firm'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteFirm(firm.id, firm.name)}
                        className="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
                        title="Delete Firm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {firms.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              No law firms found
            </p>
            <p className="text-gray-400 text-sm">
              Get started by creating your first law firm
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200 gap-4">
          <div className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-semibold">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold">{pagination.total}</span> law
            firms
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                setPagination(prev => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={pagination.page === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: pageNum }))
                    }
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() =>
                setPagination(prev => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={pagination.page === pagination.pages}
              className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Create Firm Modal */}
      {showCreateModal && (
        <CreateFirmModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateFirm}
        />
      )}
    </div>
  )
}

// Create Firm Modal Component
function CreateFirmModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    plan: 'STARTER',
    ownerEmail: '',
    ownerPassword: '',
    ownerFirstName: '',
    ownerLastName: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Create New Law Firm
              </h3>
              <p className="text-sm text-gray-600">
                Set up a new law firm with owner account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Firm Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-gray-600" />
                Firm Information
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                  placeholder="Enter firm name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    pattern="^[a-z0-9\-]+$"
                    value={formData.slug}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, slug: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                    placeholder="lowercase-with-hyphens"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      .lawfirm.com
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Domain
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, domain: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                    placeholder="firm.example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan
                </label>
                <div className="relative">
                  <Crown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={formData.plan}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, plan: e.target.value }))
                    }
                    className="w-full pl-10 pr-8 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-colors"
                  >
                    <option value="STARTER">Starter Plan</option>
                    <option value="PROFESSIONAL">Professional Plan</option>
                    <option value="ENTERPRISE">Enterprise Plan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-600" />
                Owner Information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ownerFirstName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        ownerFirstName: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ownerLastName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        ownerLastName: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.ownerEmail}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        ownerEmail: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={formData.ownerPassword}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        ownerPassword: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                    placeholder="Secure password"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password should be at least 8 characters long
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Create Law Firm
          </button>
        </div>
      </div>
    </div>
  )
}
