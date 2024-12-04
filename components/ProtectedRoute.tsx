'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
    if (!isLoading && user && window.location.pathname === '/') {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (user) {
    // Optionally, render a loading spinner or placeholder
    return <>{children}</>
  }

  return <div>Loading...</div>
}
