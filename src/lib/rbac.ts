import type { Role, ScoreState, AuthUser, Scope } from '@/types/rbac';
import { ROUTES } from '@/constants/routes';

export type Action =
  | 'create'
  | 'edit'
  | 'delete'
  | 'submit'
  | 'approve'
  | 'reject'
  | 'publish'
  | 'view'
  | 'assign';

const ROLE_ACTIONS: Record<Role, Action[]> = {
  // ADMIN là quyền giám sát toàn hệ thống: có thể xem và xử lý ở mọi chặng.
  ADMIN: ['create', 'edit', 'delete', 'submit', 'approve', 'reject', 'publish', 'view', 'assign'],
  LOCALITY: ['view', 'create', 'delete'],
  SPECIALIST: ['view', 'edit', 'submit'],
  BAN_LEADER: ['view', 'approve', 'reject'],
  COUNCIL_CHAIR: ['view', 'approve', 'reject', 'edit'],
  COUNCIL_VICE: ['view'],
  STANDING_COMMITTEE: ['view', 'approve', 'reject', 'edit', 'publish'],
};

const STATE_ACTIONS: Record<ScoreState, Action[]> = {
  DRAFT: ['edit', 'submit'],
  CHO_DUYET_BAN: ['approve', 'reject'],
  CHO_DUYET_HOI_DONG: ['approve', 'reject', 'edit'],
  CHO_DUYET_BTT: ['approve', 'reject', 'edit', 'publish'],
  DA_CONG_BO: ['view'],
};

export function can(
  user: AuthUser | null,
  action: Action,
  context?: { state?: ScoreState; scope?: Scope },
): boolean {
  if (!user) return false;

  const roleActions = ROLE_ACTIONS[user.role] || [];
  if (!roleActions.includes(action)) return false;

  if (context?.state) {
    const stateActions = STATE_ACTIONS[context.state] || [];
    if (!stateActions.includes(action)) return false;
  }

  // Scope: khi context yêu cầu scope, user PHẢI có scope tương ứng và khớp.
  // ADMIN toàn quyền, bỏ qua kiểm scope.
  if (context?.scope && user.role !== 'ADMIN') {
    if (context.scope.banId !== undefined) {
      if (user.banId === undefined || user.banId !== context.scope.banId) return false;
    }
    if (context.scope.localityId !== undefined) {
      if (user.localityId === undefined || user.localityId !== context.scope.localityId) {
        return false;
      }
    }
  }

  return true;
}

/** Ánh xạ tiền tố route → danh sách role được phép. Nguồn duy nhất route↔role. */
export const ROUTE_ROLES: Record<string, Role[]> = {
  '/thi-dua/admin': ['ADMIN'],
  '/thi-dua/dia-phuong': ['ADMIN', 'LOCALITY'],
  '/thi-dua/cham-diem': ['ADMIN', 'SPECIALIST'],
  '/thi-dua/duyet/lanh-dao-ban': ['ADMIN', 'BAN_LEADER'],
  '/thi-dua/duyet/hoi-dong-tdkt': ['ADMIN', 'COUNCIL_CHAIR', 'COUNCIL_VICE'],
  '/thi-dua/duyet/ban-thuong-truc': ['ADMIN', 'STANDING_COMMITTEE'],
  '/thi-dua/dashboard-tong-quan': [
    'ADMIN',
    'SPECIALIST',
    'BAN_LEADER',
    'COUNCIL_CHAIR',
    'COUNCIL_VICE',
    'STANDING_COMMITTEE',
  ],
  // B14: địa phương KHÔNG xem lịch sử thay đổi.
  '/thi-dua/lich-su-thay-doi': [
    'ADMIN',
    'SPECIALIST',
    'BAN_LEADER',
    'COUNCIL_CHAIR',
    'COUNCIL_VICE',
    'STANDING_COMMITTEE',
  ],
};

/** Role được phép vào path — chọn tiền tố khớp DÀI NHẤT. `null` nếu không khớp. */
export function rolesForPath(pathname: string): Role[] | null {
  const hit = Object.entries(ROUTE_ROLES)
    .filter(([prefix]) => pathname.startsWith(prefix))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return hit ? hit[1] : null;
}

export function canAccessRoute(role: Role, pathname: string): boolean {
  const roles = rolesForPath(pathname);
  return roles ? roles.includes(role) : false;
}

/** Trang mặc định của mỗi role sau khi đăng nhập / khi vào route không có quyền. */
export function defaultRouteForRole(role: Role, user?: Pick<AuthUser, 'banId'> | null): string {
  switch (role) {
    case 'LOCALITY':
      return ROUTES.LOCALITY_TRANG_THAI;
    case 'BAN_LEADER':
      return `/thi-dua/duyet/lanh-dao-ban/${user?.banId ?? 'ban1'}`;
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
