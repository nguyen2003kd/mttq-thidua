import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import { defaultRouteForRole } from '@/lib/rbac';
import type { Role } from '@/types/rbac';

interface RequireRoleProps {
  roles: Role[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={defaultRouteForRole(user.role, user)} replace />;
  }

  return <>{children}</>;
}
