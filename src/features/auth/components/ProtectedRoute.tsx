import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type UserRole } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Optionally redirect to a forbidden page or just home
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
