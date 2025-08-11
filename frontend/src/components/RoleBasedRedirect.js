import React from 'react';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';

const RoleBasedRedirect = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (userRole.role === 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  } else if (userRole.role === 'academy_user') {
    return <Navigate to="/academy" replace />;
  }

  // Default fallback
  return <Navigate to="/login" replace />;
};

export default RoleBasedRedirect;