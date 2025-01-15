import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth'
import Cookies from 'js-cookie'
import { NST_ENDPOINT, PHX_COOKIE, PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from './constants'
import { useToast } from '@/hooks/use-toast'


async function postData(data: any, options: { endpoint: string }) {
  const response = await fetch(options.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json()


}

export function useLogin() {
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const { simpleLogin, logout } = useAuth()
  const router = useRouter()
  const handleLogin = async (username: string, password: string, turnstileToken: string) => {
    setError(null)
    const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`
    const map = { id: 0, username, password, scope: 'sign_in' }

    try {
      if (turnstileToken != '') {
        // Verify Turnstile token
        const turnstileResponse = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: turnstileToken }),
        })
        console.log(turnstileResponse)
        if (!turnstileResponse.ok) {
          throw new Error('Turnstile verification failed')
        }
      }


      // Proceed with login
      const res = await postData(map, {
        endpoint: `${url}/svt_api/webhook`
      })

      if (res.status === 'ok') {
        Cookies.set(PHX_COOKIE!, res.res, { sameSite: 'Lax' })

        simpleLogin({
          username,
          token: res.res,
          userStruct: res.user,
          role_app_routes: res.role_app_routes,
          id: res.user_id
        })

        router.push('/dashboard')
      } else if (res.status === 'error') {
        logout()
        setError('Login failed. Please check your credentials and try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      logout()
      setError('An error occurred during login. Please try again.')
    }
  }
  const handleNstLogin = async (username: string, password: string) => {
    setError(null)
    const url = `${PHX_HTTP_PROTOCOL}${NST_ENDPOINT}`
    const map = { id: 0, email: username, password, scope: 'sign_in' }

    console.log(url)

    try {



      // Proceed with login
      const res = await postData(map, {
        endpoint: `${url}/admin/sign-in`
      })

      if (res.statusCode === 200) {
        // Cookies.set(PHX_COOKIE!, res.res, { sameSite: 'Lax' })
     
        Cookies.set(PHX_COOKIE!, res.data.access_token, { sameSite: 'Lax' })

        const userResponse = await fetch(`${url}/admin/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${res.data.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(userResponse)

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await userResponse.json();

        console.log(userData)



        login({
          username: userData.data.email,
          token: res.data.access_token,
          userStruct: userData.data,
          role_app_routes: res.role_app_routes || [] ,
          id: userData.data.id
        })

        router.push('/dashboard')
      } else if (res.status === 'error') {
        logout()
        setError('Login failed. Please check your credentials and try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      logout()
      setError('An error occurred during login. Please try again.')
    }
  }

  const handleLogout = () => {
    logout()
    Cookies.remove(PHX_COOKIE!)
    router.push('/login')
    setTimeout(() => {
      location.reload()
    }, 200)


  }

  return { handleLogin, handleNstLogin, handleLogout, error }
}