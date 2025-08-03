import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY
const environment = process.env.REACT_APP_ENVIRONMENT || 'development'

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}

// Get the correct redirect URL based on environment
const getRedirectUrl = () => {
  if (environment === 'production') {
    return 'https://trackmyacademy.vercel.app/reset-password'
  }
  return `${window.location.origin}/reset-password`
}

// Create Supabase client with production-ready configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Automatically refresh tokens when they expire
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session recovery from URL
    detectSessionInUrl: true,
    // Production-ready redirect URL for password reset
    redirectTo: getRedirectUrl()
  },
  // Configure realtime subscription options if needed
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper function to get current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error.message)
    return null
  }
  return session
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error.message)
    return null
  }
  return user
}

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error.message)
    throw error
  }
}