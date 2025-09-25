'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import Dashboard from '@/components/dashboard/Dashboard'
import LandingPage from '@/components/ui/LandingPage'
import { User } from '@/types/user'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const loading = status === 'loading'
  const user = session?.user as User | undefined

  useEffect(() => {
    if (session?.user && status === 'authenticated') {
      console.log('🔄 User authenticated:', {
        email: session.user.email,
        role: session.user.role,
        lawFirmId: session.user.lawFirmId,
      })

      // Check if user is superadmin - redirect to admin dashboard
      // ONLY check role, not hardcoded lawFirmId to avoid old token issues
      if (session.user.role === 'super_admin') {
        console.log('🔄 Superadmin detected, redirecting to /admin')
        router.push('/admin')
        return
      }

      // Regular law firm users go to law firm dashboard
      if (session.user.lawFirmId && session.user.lawFirmId !== '') {
        console.log('🔄 Law firm user detected, redirecting to /dashboard')
        router.push('/dashboard')
        return
      }

      // Fallback for users without proper setup
      console.log('⚠️ User has no law firm or role, staying on home page')
    }
  }, [session, status, router])

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
