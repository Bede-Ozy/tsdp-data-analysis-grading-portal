import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <LoadingSpinner size="lg" text="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Determine which login page to send user to based on path
    if (location.pathname.startsWith('/coach')) {
      return <Navigate to="/coach/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/student/login" state={{ from: location }} replace />;
  }

  // Check if role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to their respective dashboard
    if (role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (role === 'coach') return <Navigate to="/coach/dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
