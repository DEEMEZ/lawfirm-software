// Super-Admin Audit Logs Component
// Purpose: View platform-wide audit logs with filtering

'use client'

import { useState, useEffect } from 'react'

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  admin_email: string
  admin_name: string
  law_firm_name?: string
  ip_address: string
  created_at: string
  new_values?: any
}

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    lawFirmId: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchAuditLogs()
  }, [filters])

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/admin/audit?${params}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.auditLogs)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'IMPERSONATION_START': return '🔑'
      case 'IMPERSONATION_END': return '🚪'
      case 'INSERT': return '➕'
      case 'UPDATE': return '✏️'
      case 'DELETE': return '🗑️'
      default: return '📝'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'IMPERSONATION_START':
      case 'IMPERSONATION_END':
        return 'bg-yellow-100 text-yellow-800'
      case 'INSERT': return 'bg-green-100 text-green-800'
      case 'UPDATE': return 'bg-blue-100 text-blue-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Audit Logs</h1>
        <p className="text-gray-600">Monitor all platform administrative activities</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Actions</option>
              <option value="IMPERSONATION_START">Impersonation Start</option>
              <option value="IMPERSONATION_END">Impersonation End</option>
              <option value="INSERT">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              <option value="law_firm">Law Firm</option>
              <option value="user">User</option>
              <option value="case">Case</option>
              <option value="document">Document</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                action: '',
                entityType: '',
                lawFirmId: '',
                startDate: '',
                endDate: ''
              })}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No audit logs found for the selected criteria.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{getActionIcon(log.action)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-sm text-gray-600">
                          on {log.entity_type}
                        </span>
                        {log.law_firm_name && (
                          <span className="text-sm text-blue-600">
                            @ {log.law_firm_name}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        By <strong>{log.admin_name || 'Unknown'}</strong> ({log.admin_email || 'unknown@example.com'})
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formatDate(log.created_at)} • IP: {log.ip_address}
                      </div>
                      {log.new_values && log.action.includes('IMPERSONATION') && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                          <strong>Reason:</strong> {log.new_values.reason}
                          {log.new_values.ticketNumber && (
                            <span> • Ticket: {log.new_values.ticketNumber}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}