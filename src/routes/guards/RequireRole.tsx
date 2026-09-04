import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import type { Role } from '@/types/rbac';

interface RequireRoleProps {
  roles: Role[];
  children: ReactNode;
}

function getDefaultRoute(role: Role): string {
  switch (role) {
    case 'LOCALITY':
      return ROUTES.LOCALITY_TRANG_THAI;
    case 'BAN_LEADER':
      return '/thi-dua/duyet/lanh-dao-ban/ban1';
    case 'COUNCIL_CHAIR':
    case 'COUNCIL_VICE':
      return ROUTES.DUYET_COUNCIL;
    case 'STANDING_COMMITTEE':
      return ROUTES.DUYET_STANDING;
    case 'ADMIN':
    case 'SPECIALIST':
    default:
      return ROUTES.DASHBOARD_OVERVIEW;
  }
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return <>{children}</>;
}
