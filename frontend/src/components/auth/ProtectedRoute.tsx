import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';


interface ProtectedRouteProps {
  allowedRoles?: string[];
  requiredPermissions?: string[];
}

export default function ProtectedRoute({ allowedRoles, requiredPermissions }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role key
  if (allowedRoles && user) {
    const userRoleKey = typeof user.role === 'object' ? (user.role as any)?.key : user.role;
    if (!allowedRoles.includes(userRoleKey)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permissions
  if (requiredPermissions && user) {
    const userPermissions = typeof user.role === 'object' ? (user.role as any)?.permissions || [] : [];
    const hasAll = requiredPermissions.every(
      (p) => userPermissions.includes('*') || userPermissions.includes(p)
    );
    if (!hasAll) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
}