'use client'

import { User } from '@/types/user'

interface DashboardProps {
  user: User
}

export default function Dashboard({}: DashboardProps) {
  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Law Firm Management System
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Streamline your legal practice with our comprehensive software
            solution
          </p>

          <div className="mt-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Dashboard
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>
                    Welcome to your law firm dashboard. Authentication is
                    working!
                  </p>
                </div>
                <div className="mt-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900">Cases</h4>
                      <p className="text-blue-700">Manage your cases</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900">Clients</h4>
                      <p className="text-green-700">Client management</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900">Documents</h4>
                      <p className="text-purple-700">Document storage</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
