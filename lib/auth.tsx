'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { PHX_COOKIE, PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from './constants'

// lib/auth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../src/lib/firebaseConfig';
import { postData } from './svt_utils'


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
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => void
  forgotPassword: (email: string) => Promise<void> 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Add debug effect
  useEffect(() => {
    console.log('Auth state changed:', {
      user,
      isLoading,
      hasCookie: Cookies.get(PHX_COOKIE)
    });
  }, [user, isLoading]);

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
        alert("!")
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

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Make the webhook call to your backend
      const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`;
      const response = await postData({
        endpoint: `${url}/svt_api/webhook`,
        data: {
          scope: "google_signin",
          result: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email,
          }
        }
      });

      // Assuming your backend returns the user data in the format you need
      if (response && response.user) {
        setUser({
          token: response.cookie,
          username: response.user.username ?? '',
          userStruct: response.user,
          role_app_routes: response.user.role.role_app_routes ?? [],
          id: response.user.id ?? 0,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const logout = () => {
    setUser(null)
    setIsLoading(false)
    Cookies.remove(PHX_COOKIE)
    router.push('/login')
  }
  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  const loginWithGoogle = async () => {
    try {
      const googleProvider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      
      // Make the webhook call to your backend
      const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`;
      const response = await postData({
        endpoint: `${url}/svt_api/webhook`,
        data: {
          scope: "google_signin",
          result: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email,
            photoURL: firebaseUser.photoURL,
          }
        }
      });

      // If backend returns user data, set it in state
      if (response && response.user) {
        // Store the cookie first
        if (response.cookie) {
          Cookies.set(PHX_COOKIE, response.cookie);
        }

        const userData = {
          token: response.cookie,
          username: response.user.username ?? firebaseUser.displayName ?? '',
          userStruct: response.user,
          role_app_routes: response.user.role.role_app_routes ?? [],
          id: response.user.id ?? 0,
        };
        
        // Set user state
        setUser(userData);
        
        // Wait a bit to ensure state is updated before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to home or dashboard
        router.push('/');
      } else {
        throw new Error('No user data received from backend');
      }
    } catch (error) {
      console.error('Google login error:', error);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      loginWithGoogle, 
      logout, 
      forgotPassword 
    }}>
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

export const signUp = async (email: string, password: string) => {
  let res = createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
    let user = userCredential.user;
    const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`
    postData({endpoint: `${url}/svt_api/webhook`,
      data: {
        scope: "google_signin",
        result: {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email,
        }
      }
    })
    console.log(userCredential);
  });
  return res;
};

export const signIn = async (email: string, password: string) => {
  let res = signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
    let user = userCredential.user;
    const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`
    postData({endpoint: `${url}/svt_api/webhook`,
      data: {
        scope: "google_signin",
        result: {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email,
        }
      }
    })
    console.log(userCredential);
  });

  console.log(res)

  return res;
};

export const forgotPassword = async(email: string ) => {
  try {
    let res =   await sendPasswordResetEmail(auth, email)
    console.log('Password reset email sent successfully')

    return res ; 
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw error // Rethrow error to handle in the calling component if needed
  }
}

export const logOut = async () => {
  return signOut(auth);
};