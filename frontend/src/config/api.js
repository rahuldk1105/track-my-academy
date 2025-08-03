// Production-ready API configuration

const getBackendURL = () => {
  // In production, use environment variable
  if (process.env.REACT_APP_ENVIRONMENT === 'production') {
    return process.env.REACT_APP_BACKEND_URL || 'https://your-app-backend.onrender.com';
  }
  
  // In development, use local backend
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
};

export const API_CONFIG = {
  BASE_URL: getBackendURL(),
  SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development'
};

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  SIGNUP: '/api/auth/signup',
  SIGNIN: '/api/auth/signin',
  PROFILE: '/api/auth/profile',
  SYNC_PROFILE: '/api/auth/sync-profile',
  RESET_PASSWORD: '/api/auth/reset-password',
  
  // Academies
  ACADEMIES: '/api/academies',
  SUPER_ADMIN_ACADEMIES: '/api/super-admin/academies',
  UPLOAD_LOGO: '/api/upload-academy-logo',
  
  // Users
  COACHES: '/api/coaches',
  STUDENTS: '/api/students',
  ASSIGN_COACH: (studentId, coachId) => `/api/students/${studentId}/assign-coach/${coachId}`,
  
  // Sessions
  SESSIONS: '/api/sessions',
  SESSION_BY_ID: (id) => `/api/sessions/${id}`,
  SESSION_ATTENDANCE: (id) => `/api/sessions/${id}/attendance`,
  
  // Attendance
  ATTENDANCE: '/api/attendance',
  
  // Performance
  PERFORMANCE_HISTORY: '/api/performance-history',
  STUDENT_PERFORMANCE: (studentId) => `/api/students/${studentId}/performance-history`,
  
  // Analytics
  ATTENDANCE_ANALYTICS: (studentId) => `/api/analytics/attendance/${studentId}`,
  PERFORMANCE_ANALYTICS: (studentId) => `/api/analytics/performance/${studentId}`,
  
  // Health
  HEALTH: '/api/health',
  CREATE_SUPER_ADMIN: '/api/create-super-admin'
};

// Request interceptor for adding auth headers
export const createAuthHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Error handling utility
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.detail || error.response.data?.message || 'Server error occurred';
  } else if (error.request) {
    // Request made but no response
    return 'Unable to connect to server. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

// Production logging
export const logError = (error, context = '') => {
  if (API_CONFIG.ENVIRONMENT === 'development') {
    console.error(`[${context}] Error:`, error);
  }
  // In production, you might want to send to error tracking service
};

export default API_CONFIG;