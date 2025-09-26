'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  LayoutDashboard,
  Building2,
  Menu,
  Shield,
} from 'lucide-react'

interface SidebarProps {
  userRole?: string
}

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: string
  submenu?: NavItem[]
}

export default function Sidebar({}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  // Navigation items for superadmin
  const navItems: NavItem[] = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/firms',
      label: 'Law Firms',
      icon: Building2,
    },
    {
      href: '/admin/audit',
      label: 'Audit Logs',
      icon: Shield,
    },
  ]

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        setIsCollapsed(!isCollapsed)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCollapsed])

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border"
      >
        <Menu className="h-6 w-6 text-gray-600" />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:relative lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 h-[73px]">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  Super Admin
                </h1>
                <p className="text-xs text-gray-500 truncate">
                  Platform Console
                </p>
              </div>
            </div>
          )}

          {/* Collapse button - only on desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${
              isCollapsed ? 'mx-auto' : ''
            }`}
          >
            <ChevronLeft
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 px-3 py-4 space-y-1 ${isCollapsed ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
                  transition-all duration-200 group relative
                  ${
                    active
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`
                    flex-shrink-0 h-5 w-5 transition-colors
                    ${active ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'}
                  `}
                />

                {!isCollapsed && (
                  <>
                    <span className="ml-3 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div
                    className="
                    absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    pointer-events-none whitespace-nowrap z-50
                  "
                  >
                    {item.label}
                    {item.badge && (
                      <span className="ml-1 px-1.5 py-0.5 bg-gray-700 rounded text-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {!isCollapsed ? (
            <div className="text-xs text-gray-500 text-center">
              <p>Platform v2.1.0</p>
              <p className="mt-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                  Ctrl+B
                </kbd>{' '}
                to toggle
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="w-2 h-2 bg-green-400 rounded-full"
                title="System Online"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
