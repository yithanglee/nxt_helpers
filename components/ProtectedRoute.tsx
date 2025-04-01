'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoutes?: string[]
}

export default function ProtectedRoute({ children, allowedRoutes = [] }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!user) {
        router.push('/')
        return
      }

      // If authenticated but on root, redirect to dashboard
      if (user && pathname === '/') {
        router.push('/dashboard')
        return
      }

      // Check role-based access
      if (user?.userStruct?.role && allowedRoutes.length > 0) {
        const isAdmin = user.userStruct.role.name === 'admin'
        const hasRouteAccess = isAdmin || allowedRoutes.some(route => pathname.startsWith(route))

        if (!hasRouteAccess) {
          console.log('Access denied to:', pathname)
          router.push('/dashboard')
          return
        }
        
        // Only set access if all checks pass
        setHasAccess(true)
      } else {
        // If no allowedRoutes specified or user has role, grant access
        setHasAccess(true)
      }
    }
  }, [user, isLoading, router, pathname, allowedRoutes])

  // Show loading state while checking authentication or access
  if (isLoading || !user?.userStruct?.role || !hasAccess) {
    return <div>Loading...</div>
  }

  // Only render children if user has been granted access
  return <>{children}</>
}
