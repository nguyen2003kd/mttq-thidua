import type { Role, ScoreState, AuthUser, Scope } from '@/types/rbac';
import { ROUTES } from '@/constants/routes';

export type Action = 'create' | 'edit' | 'delete' | 'submit' | 'approve' | 'reject' | 'publish' | 'view' | 'assign';

const ROLE_ACTIONS: Record<Role, Action[]> = {
  LOCAL: ['view', 'create', 'edit', 'delete', 'submit'],
  SPECIALIST: ['view', 'create', 'edit', 'delete', 'submit', 'reject', 'assign'],
  LEADER: ['view', 'approve', 'reject'],
  // Hội đồng và Ủy ban chỉ xem, duyệt/công bố hoặc yêu cầu bổ sung; không sửa điểm trực tiếp.
  COUNCIL: ['view', 'approve', 'reject'],
  COMMITTEE: ['view', 'approve', 'reject', 'publish'],
  // Admin quản trị hệ thống — không chấm/duyệt điểm
  ADMIN: ['view'],
};

const STATE_ACTIONS: Record<ScoreState, Action[]> = {
  DRAFT: ['edit', 'submit'],
  CHO_CHUYEN_VIEN: ['edit', 'submit', 'reject'],
  CHO_DUYET_BAN: ['approve', 'reject'],
  CHO_DUYET_HOI_DONG: ['approve', 'reject'],
  CHO_DUYET_BTT: ['approve', 'reject', 'publish'],
  DA_CONG_BO: ['view'],
};

export function can(user: AuthUser | null, action: Action, context?: { state?: ScoreState; scope?: Scope }): boolean {
  if (!user || !ROLE_ACTIONS[user.role].includes(action)) return false;
  if (context?.state && !STATE_ACTIONS[context.state].includes(action)) return false;
  if (context?.scope?.banId !== undefined && user.banId !== context.scope.banId) return false;
  if (context?.scope?.localityId !== undefined && user.localityId !== context.scope.localityId) return false;
  return true;
}

export const ROUTE_ROLES: Record<string, Role[]> = {
  '/thi-dua/admin': ['SPECIALIST', 'ADMIN'],
  '/thi-dua/dia-phuong': ['LOCAL'],
  '/thi-dua/cham-diem': ['SPECIALIST'],
  '/chuyen-vien': ['SPECIALIST'],
  '/dia-phuong': ['LOCAL'],
  '/thi-dua/duyet/lanh-dao-ban': ['LEADER'],
  '/thi-dua/duyet/hoi-dong-tdkt': ['COUNCIL'],
  '/thi-dua/duyet/ban-thuong-truc': ['COMMITTEE'],
  '/hoi-dong/lich-su': ['COUNCIL'],
  '/uy-ban/lich-su': ['COMMITTEE'],
  // Tạm tắt trang tổng quan — bật lại cùng với route trong App.tsx
  // '/thi-dua/dashboard-tong-quan': ['SPECIALIST', 'LEADER', 'COUNCIL', 'COMMITTEE'],
  '/thi-dua/lich-su-thay-doi': ['SPECIALIST', 'LEADER', 'COUNCIL', 'COMMITTEE', 'LOCAL'],
};

export function rolesForPath(pathname: string): Role[] | null {
  const hit = Object.entries(ROUTE_ROLES).filter(([prefix]) => pathname.startsWith(prefix)).sort((a, b) => b[0].length - a[0].length)[0];
  return hit ? hit[1] : null;
}

export function canAccessRoute(role: Role, pathname: string): boolean {
  return rolesForPath(pathname)?.includes(role) ?? false;
}

export function defaultRouteForRole(role: Role, user?: Pick<AuthUser, 'banId'> | null): string {
  switch (role) {
    case 'LOCAL': return ROUTES.LOCALITY_CRITERIA;
    case 'LEADER': return `/thi-dua/duyet/lanh-dao-ban/${user?.banId ?? 'ban1'}`;
    case 'COUNCIL': return ROUTES.DUYET_COUNCIL;
    case 'COMMITTEE': return ROUTES.DUYET_STANDING;
    case 'SPECIALIST': return ROUTES.SPECIALIST_REVIEW;
    case 'ADMIN': return ROUTES.ADMIN_CRITERIA_LIST;
  }
}
