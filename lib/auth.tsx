'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { PHX_COOKIE, PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from './constants'
import { postData } from './svt_utils'
import { obtainGoogleIdToken } from './googleIdToken'

interface User {
  username: string
  userStruct?: Record<any, any>
  token: string
  role_app_routes: string[]
  id: number
  organization_id: string
  uid?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  simpleLogin: (userData: User) => void
  /** Prefer Phoenix password login via useLogin; kept for compatibility. */
  login: (email: string, password: string, origin: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => void
  forgotPassword: (email: string) => Promise<void>
  updateUserProfile: (newEmail?: string, newDisplayName?: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const storedCookie = Cookies.get(PHX_COOKIE)

        if (storedCookie) {
          const response = await fetch(
            `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}/svt_api/webhook?scope=get_cookie_user&cookie=` +
              storedCookie,
            { method: 'GET' },
          )

          if (!response.ok) {
            throw new Error('Failed to fetch user data')
          }

          const storedUser = await response.json()

          if (storedUser) {
            if (
              Object.keys(storedUser).includes('statusCode') &&
              Object.keys(storedUser).includes('message') &&
              Object.keys(storedUser).includes('data')
            ) {
              setUser({
                organization_id: storedUser.data.res.organization_id,
                token: storedUser.data.res.tokens.access_token,
                username: storedUser.data.res.admin.username ?? '',
                userStruct: storedUser.data.res.admin,
                role_app_routes: [],
                id: storedUser.data.res.admin.id ?? 0,
              })
            } else {
              setUser({
                organization_id: storedUser.user.organization_id,
                token: storedUser.cookie,
                username: storedUser.user.username ?? '',
                userStruct: storedUser.user,
                role_app_routes: storedUser.user.role.role_app_routes ?? [],
                id: storedUser.user.id ?? 0,
                uid: storedUser.user.psid ?? '',
              })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        Cookies.remove(PHX_COOKIE)
      } finally {
        setIsLoading(false)
      }
    }

    checkExistingUser()
  }, [])

  const simpleLogin = (userData: User) => {
    setUser(userData)
    setIsLoading(false)
  }

  const login = async (email: string, password: string, _origin: string) => {
    const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`
    const response = await postData({
      endpoint: `${url}/svt_api/webhook`,
      data: {
        scope: 'member_sign_in',
        user: { username: email, password },
      },
    })

    if (response?.status !== 'ok') {
      throw new Error(response?.reason || response?.message || 'Login failed')
    }

    const token =
      (typeof response.res === 'string' && response.res) ||
      response.token ||
      response.cookie ||
      ''

    if (!token) {
      throw new Error('No session token from server')
    }

    Cookies.set(PHX_COOKIE!, token)
    setUser({
      token,
      username: response.user?.username ?? email,
      userStruct: response.user,
      role_app_routes: response.role_app_routes ?? [],
      id: response.user_id ?? response.id ?? response.user?.id ?? 0,
      organization_id: response.user?.organization_id ?? '',
    })
    router.push('/')
  }

  const logout = () => {
    setUser(null)
    setIsLoading(false)
    Cookies.remove(PHX_COOKIE)
    router.push('/login')
  }

  const forgotPassword = async (_email: string) => {
    throw new Error('Use the forgot-password page / Phoenix OTP flow')
  }

  const loginWithGoogle = async () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
      const idToken = await obtainGoogleIdToken(clientId)
      const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`
      const response = await postData({
        endpoint: `${url}/svt_api/webhook`,
        data: {
          scope: 'google_signin',
          id_token: idToken,
        },
      })

      if (response?.status === 'ok' && (response.user || response.res)) {
        const token =
          (typeof response.res === 'string' && response.res) ||
          response.cookie ||
          response.token ||
          ''

        if (token) {
          Cookies.set(PHX_COOKIE!, token)
        }

        const userData: User = {
          token: token || Cookies.get(PHX_COOKIE!) || '',
          username: response.user?.username ?? response.user?.email ?? 'Google User',
          userStruct: response.user,
          role_app_routes: response.role_app_routes ?? response.user?.role?.role_app_routes ?? [],
          id: response.user_id ?? response.id ?? response.user?.id ?? 0,
          organization_id: response.user?.organization_id ?? '',
        }

        setUser(userData)
        await new Promise((resolve) => setTimeout(resolve, 100))
        router.push('/')
        return
      }

      throw new Error(response?.reason || response?.message || 'No user data received from backend')
    } catch (error) {
      console.error('Google login error:', error)
      setUser(null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserProfile = async (_newEmail?: string, _newDisplayName?: string) => {
    throw new Error('Update profile via the Phoenix user profile API')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        simpleLogin,
        login,
        loginWithGoogle,
        logout,
        forgotPassword,
        updateUserProfile,
      }}
    >
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

export const signUp = async (_email: string, _password: string) => {
  throw new Error('Registration uses the Phoenix member register flow')
}

export const signIn = async (email: string, password: string, origin: string) => {
  const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`
  return postData({
    endpoint: `${url}/svt_api/webhook`,
    additionalHeaders: {
      'phx-request': origin,
    },
    data: {
      scope: 'member_sign_in',
      user: { username: email, password },
    },
  })
}

export const forgotPassword = async (_email: string) => {
  throw new Error('Use the forgot-password page / Phoenix OTP flow')
}

export const logOut = async () => {
  Cookies.remove(PHX_COOKIE)
}
