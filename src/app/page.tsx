'use client'

import { useSession } from 'next-auth/react'
import Navbar from '@/components/ui/Navbar'
import Dashboard from '@/components/dashboard/Dashboard'
import LandingPage from '@/components/ui/LandingPage'
import { User } from '@/types/user'

export default function Home() {
  const { data: session, status } = useSession()
  const loading = status === 'loading'
  const user = session?.user as User | undefined

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || null} />
      {user ? <Dashboard user={user} /> : <LandingPage />}
    </div>
  )
}
