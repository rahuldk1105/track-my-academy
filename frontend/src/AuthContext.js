import React, { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  const fetchUserRole = async (activeSession) => {
    if (!activeSession?.access_token) {
      setUserRole(null)
      return
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${activeSession.access_token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        if (userData.user && userData.user.role_info) {
          setUserRole(userData.user.role_info)
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      setUserRole(null)
    }
  }

  // --- NEW: refresh token helper ---
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) return null

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (!res.ok) {
        console.error('Failed to refresh token')
        return null
      }

      const data = await res.json()
      if (data?.session?.access_token && data?.session?.refresh_token) {
        localStorage.setItem('refresh_token', data.session.refresh_token)
        setSession(data.session)
        setUser(data.session.user)
        return data.session.access_token
      }
    } catch (err) {
      console.error('Error refreshing token:', err)
      return null
    }
  }

  // --- NEW: helper for components to always get valid token ---
  const getValidToken = async () => {
    // If session still valid, return token
    if (session?.access_token) return session.access_token
    // Otherwise refresh
    return await refreshAccessToken()
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      // Store refresh token locally
      if (session?.refresh_token) {
        localStorage.setItem('refresh_token', session.refresh_token)
      }

      if (session) {
        await fetchUserRole(session)
      }

      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        // Store refresh token on every change
        if (session?.refresh_token) {
          localStorage.setItem('refresh_token', session.refresh_token)
        }

        if (session) {
          await fetchUserRole(session)
        } else {
          setUserRole(null)
          localStorage.removeItem('refresh_token')
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (data?.session?.refresh_token) {
      localStorage.setItem('refresh_token', data.session.refresh_token)
    }
    return { data, error }
  }

  const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData }
    })
    if (data?.session?.refresh_token) {
      localStorage.setItem('refresh_token', data.session.refresh_token)
    }
    return { data, error }
  }

  const signOut = async () => {
    localStorage.removeItem('refresh_token')
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    token: session?.access_token,
    userRole,
    signIn,
    signUp,
    signOut,
    refreshUserRole: () => fetchUserRole(session),
    getValidToken, // expose helper
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
