'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { PHX_COOKIE, PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from './constants'

interface User {
  username: string
  userStruct?: Record<any, any>
  token: string
  role_app_routes: string[]
  id: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (userData: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        console.log("Checking existing user...");

        // Get the stored cookie
        const storedCookie = Cookies.get(PHX_COOKIE);

        if (storedCookie) {
          // Fetch the user data securely
          const response = await fetch(
            `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}/svt_api/webhook?scope=get_cookie_user&cookie=` + storedCookie,
            {
              method: 'GET',
              credentials: 'include',
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          // Parse the user data
          const storedUser = await response.json();

          // If user data exists, set the user in the state
          if (storedUser) {
            setUser({
              token: storedUser.cookie,
              username: storedUser.user.username ?? '',
              userStruct: storedUser.user, 
              role_app_routes: storedUser.user.role.role_app_routes ?? [],
              id: storedUser.user.id ?? 0,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false); // Authentication check is complete
      }
    };

    // Invoke the asynchronous function
    checkExistingUser();
  }, []);

  // Log the user whenever it changes
  useEffect(() => {
    console.log("User updated:", user);
  }, [user]);

  const login = (userData: User) => {
    console.log(userData)
    setUser(userData)
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    setIsLoading(false)
    Cookies.remove(PHX_COOKIE)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
