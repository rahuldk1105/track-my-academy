import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getCurrentSession, getCurrentUser, signOut } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

  // Initialize auth state on component mount
  useEffect(() => {
    initializeAuth()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        
        setSession(session)
        setUser(session?.user || null)
        
        if (session?.user) {
          // Store access token in localStorage for API calls
          localStorage.setItem('supabase_access_token', session.access_token);
          
          // Extract user profile from token or fetch from backend
          const profile = {
            user_id: session.user.id,
            email: session.user.email,
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            role: session.user.user_metadata?.role || 'student'
          }
          setUserProfile(profile)
        } else {
          // Clear stored token on logout
          localStorage.removeItem('supabase_access_token');
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const initializeAuth = async () => {
    try {
      const session = await getCurrentSession()
      setSession(session)
      setUser(session?.user || null)
      
      if (session?.user) {
        // Store access token in localStorage for API calls
        localStorage.setItem('supabase_access_token', session.access_token);
        
        const profile = {
          user_id: session.user.id,
          email: session.user.email,
          first_name: session.user.user_metadata?.first_name || '',
          last_name: session.user.user_metadata?.last_name || '',
          role: session.user.user_metadata?.role || 'student'
        }
        setUserProfile(profile)
      } else {
        localStorage.removeItem('supabase_access_token');
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      toast.error('Error initializing authentication')
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, firstName, lastName, role = 'student') => {
    try {
      setLoading(true)
      
      // Use backend API for signup to ensure proper role assignment
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          role
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(result.message)
        return { data: result.user, error: null }
      } else {
        throw new Error(result.detail || 'Failed to create account')
      }
    } catch (error) {
      console.error('Error signing up:', error)
      toast.error(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      
      // Use Supabase client for signin
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      toast.success('Successfully signed in!')
      return { data, error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      toast.error(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      toast.success('Password reset link sent to your email!')
      return { error: null }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error(error.message)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('Password updated successfully!')
      return { error: null }
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error(error.message)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOutUser = async () => {
    try {
      setLoading(true)
      await signOut()
      localStorage.removeItem('supabase_access_token')
      setUser(null)
      setSession(null)
      setUserProfile(null)
      toast.success('Successfully signed out!')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOutUser,
    resetPassword,
    updatePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}