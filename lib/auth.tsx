'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { PHX_COOKIE, PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from './constants'

// lib/auth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, updateProfile, updateEmail, sendEmailVerification, verifyBeforeUpdateEmail } from 'firebase/auth';
import { auth } from '../../src/lib/firebaseConfig';
import { postData } from './svt_utils'

import { onAuthStateChanged } from 'firebase/auth';
import { toast } from '../../next_src/hooks/use-toast'


interface User {
  username: string
  userStruct?: Record<any, any>
  token: string
  role_app_routes: string[]
  id: number
  uid?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  simpleLogin: (userData: User) => void
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
              // credentials: 'include',
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          // Parse the user data
          const storedUser = await response.json();

          // If user data exists, set the user in the state
          if (storedUser) {
            if (Object.keys(storedUser).includes('statusCode') && Object.keys(storedUser).includes('message') && Object.keys(storedUser).includes('data')) {
              setUser({
                token: storedUser.data.res.tokens.access_token,
                username: storedUser.data.res.admin.username ?? '',
                userStruct: storedUser.data.res.admin,
                role_app_routes: [],
                id: storedUser.data.res.admin.id ?? 0,
              });
            } else {
              setUser({
                token: storedUser.cookie,
                username: storedUser.user.username ?? '',
                userStruct: storedUser.user,
                role_app_routes: storedUser.user.role.role_app_routes ?? [],
                id: storedUser.user.id ?? 0,
                uid: storedUser.user.psid ?? '',
              });
            }

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


  const simpleLogin = (userData: User) => {


    setUser(userData)
    setIsLoading(false)
  }


  const login = async (email: string, password: string, origin: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Make the webhook call to your backend
      const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`;
      const response = await postData({
        endpoint: `${url}/svt_api/webhook`,
        additionalHeaders: {
          'phx-request': origin
        },
        data: {
          scope: "google_signin",
          result: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email,
          }
        }
      });

      console.log("response")
      console.log(response)

      if (response && response.data && response.data.res) {
        // Store the cookie first
        if (response.data.res) {
          Cookies.set(PHX_COOKIE, response.data.res);
          console.log("cookie set")
          console.log(Cookies.get(PHX_COOKIE))
        }

        const userData = {
          token: response.data.res,
          username: response.data.res.username ?? firebaseUser.email ?? '',
          userStruct: response.data,
          role_app_routes: [],
          id: response.data.res.id ?? 0
        };

        // Set user state
        setUser(userData);

        // Wait a bit to ensure state is updated before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log("userData")
        console.log(userData)
        // Redirect to home or dashboard
        router.push('/');
      } else {
        throw new Error('No user data received from backend');
      }
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
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
  const updateUserProfile = async (newEmail?: string, newDisplayName?: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Update tasks to perform
      const updateTasks: Promise<void>[] = [];

      // Handle email update if provided
      if (newEmail && newEmail !== currentUser.email) {
        try {
          // Re-authenticate user before updating email
          const credential = await signInWithEmailAndPassword(auth, currentUser.email!, prompt('Please enter your password') || '');
          await verifyBeforeUpdateEmail(credential.user, newEmail);

          toast({
            title: "Error",
            description: 'Please check your email to verify your new email address.',
            variant: "destructive",
          });


          throw new Error('Please check your email to verify your new email address.');
        } catch (error: any) {
          if (error?.code === 'auth/requires-recent-login') {
            throw new Error('For security reasons, please sign out and sign in again before changing your email.');
          }
          throw error;
        }
      }

      // Update display name if provided
      if (newDisplayName) {
        updateTasks.push(updateProfile(currentUser, {
          displayName: newDisplayName
        }));
      }

      // Execute all updates
      await Promise.all(updateTasks);

      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      simpleLogin,
      login,
      loginWithGoogle,
      logout,
      forgotPassword, updateUserProfile
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
    postData({
      endpoint: `${url}/svt_api/webhook`,
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

export const signIn = async (email: string, password: string, origin: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`;

    const response = await postData({
      endpoint: `${url}/svt_api/webhook`,
      additionalHeaders: {
        'phx-request': origin
      },
      data: {
        scope: "google_signin",
        result: {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email,
        }
      }
    });

    console.log('Sign in response:', response);
    return response;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  try {
    let res = await sendPasswordResetEmail(auth, email)
    console.log('Password reset email sent successfully')

    return res;
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw error // Rethrow error to handle in the calling component if needed
  }
}

export const logOut = async () => {
  return signOut(auth);
};
