
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ReactNode } from 'react';

export interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0) {
    const role = isAdmin ? 'admin' : 'employee';
    if (!allowedRoles.includes(role)) {
      // Redirect to appropriate dashboard if role is not allowed
      return <Navigate to={isAdmin ? "/admin" : "/dashboard"} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
