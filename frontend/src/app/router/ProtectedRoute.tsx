import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ adminOnly = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Replace with a proper loader later
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
