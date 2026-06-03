import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  // If session is bootstrapping, display a simple visual loading layout
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Validating Session...</span>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated block
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Admin lockdown block
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
