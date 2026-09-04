import type { Role, ScoreState, AuthUser, Scope } from '@/types/rbac';

export type Action = 'create' | 'edit' | 'delete' | 'submit' | 'approve' | 'reject' | 'publish' | 'view' | 'assign';

const ROLE_ACTIONS: Record<Role, Action[]> = {
  ADMIN: ['create', 'edit', 'delete', 'view', 'assign'],
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

  if (context?.scope) {
    if (context.scope.banId && user.banId && context.scope.banId !== user.banId) {
      return false;
    }
    if (context.scope.localityId && user.localityId && context.scope.localityId !== user.localityId) {
      return false;
    }
  }

  return true;
}

export function canAccessRoute(role: Role, routePrefix: string): boolean {
  const routeRoleMap: Record<string, Role[]> = {
    '/thi-dua/admin': ['ADMIN'],
    '/thi-dua/dia-phuong': ['LOCALITY'],
    '/thi-dua/cham-diem': ['SPECIALIST'],
    '/thi-dua/duyet/lanh-dao-ban': ['BAN_LEADER'],
    '/thi-dua/duyet/hoi-dong-tdkt': ['COUNCIL_CHAIR', 'COUNCIL_VICE'],
    '/thi-dua/duyet/ban-thuong-truc': ['STANDING_COMMITTEE'],
    '/thi-dua/dashboard-tong-quan': ['ADMIN', 'SPECIALIST', 'BAN_LEADER', 'COUNCIL_CHAIR', 'COUNCIL_VICE', 'STANDING_COMMITTEE'],
    '/thi-dua/lich-su-thay-doi': ['ADMIN', 'SPECIALIST', 'BAN_LEADER', 'COUNCIL_CHAIR', 'COUNCIL_VICE', 'STANDING_COMMITTEE', 'LOCALITY'],
  };

  for (const [prefix, roles] of Object.entries(routeRoleMap)) {
    if (routePrefix.startsWith(prefix)) {
      return roles.includes(role);
    }
  }

  return false;
}
