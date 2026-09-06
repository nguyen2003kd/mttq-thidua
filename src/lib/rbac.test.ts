import { describe, it, expect } from 'vitest';
import {
  can,
  rolesForPath,
  canAccessRoute,
  defaultRouteForRole,
  type Action,
} from './rbac';
import type { AuthUser, Role, ScoreState } from '@/types/rbac';

const mk = (role: Role, extra: Partial<AuthUser> = {}): AuthUser => ({
  id: 'u',
  name: 'x',
  role,
  ...extra,
});

describe('can() — role × action', () => {
  it('user null → luôn false', () => {
    expect(can(null, 'view')).toBe(false);
  });

  it('SPECIALIST: edit/submit/view có, approve/create không', () => {
    const u = mk('SPECIALIST');
    expect(can(u, 'edit')).toBe(true);
    expect(can(u, 'submit')).toBe(true);
    expect(can(u, 'view')).toBe(true);
    expect(can(u, 'approve')).toBe(false);
    expect(can(u, 'create')).toBe(false);
  });

  it('BAN_LEADER: approve/reject có, edit/publish không', () => {
    const u = mk('BAN_LEADER');
    expect(can(u, 'approve')).toBe(true);
    expect(can(u, 'reject')).toBe(true);
    expect(can(u, 'edit')).toBe(false);
    expect(can(u, 'publish')).toBe(false);
  });

  it('STANDING_COMMITTEE có publish, ADMIN không', () => {
    expect(can(mk('STANDING_COMMITTEE'), 'publish')).toBe(true);
    expect(can(mk('ADMIN'), 'publish')).toBe(false);
  });

  it('COUNCIL_VICE chỉ view', () => {
    const u = mk('COUNCIL_VICE');
    expect(can(u, 'view')).toBe(true);
    expect(can(u, 'approve')).toBe(false);
    expect(can(u, 'reject')).toBe(false);
  });
});

describe('can() — kết hợp state', () => {
  const cases: Array<[Role, Action, ScoreState, boolean]> = [
    ['SPECIALIST', 'edit', 'DRAFT', true],
    ['SPECIALIST', 'submit', 'DRAFT', true],
    ['SPECIALIST', 'edit', 'CHO_DUYET_BAN', false],
    ['BAN_LEADER', 'approve', 'CHO_DUYET_BAN', true],
    ['BAN_LEADER', 'reject', 'CHO_DUYET_BAN', true],
    ['BAN_LEADER', 'approve', 'DRAFT', false],
    ['COUNCIL_CHAIR', 'approve', 'CHO_DUYET_HOI_DONG', true],
    ['COUNCIL_CHAIR', 'edit', 'CHO_DUYET_HOI_DONG', true],
    ['STANDING_COMMITTEE', 'publish', 'CHO_DUYET_BTT', true],
    ['STANDING_COMMITTEE', 'publish', 'CHO_DUYET_HOI_DONG', false],
    ['STANDING_COMMITTEE', 'edit', 'DA_CONG_BO', false],
    ['ADMIN', 'publish', 'CHO_DUYET_BTT', false],
  ];
  it.each(cases)('%s %s @%s → %s', (role, action, state, expected) => {
    expect(can(mk(role), action, { state })).toBe(expected);
  });
});

describe('can() — scope (B7)', () => {
  it('BAN_LEADER thiếu banId + context yêu cầu scope.banId → false', () => {
    expect(can(mk('BAN_LEADER'), 'approve', { state: 'CHO_DUYET_BAN', scope: { banId: 'ban1' } })).toBe(
      false,
    );
  });
  it('BAN_LEADER banId khớp → true, lệch → false', () => {
    expect(
      can(mk('BAN_LEADER', { banId: 'ban1' }), 'approve', {
        state: 'CHO_DUYET_BAN',
        scope: { banId: 'ban1' },
      }),
    ).toBe(true);
    expect(
      can(mk('BAN_LEADER', { banId: 'ban1' }), 'approve', {
        state: 'CHO_DUYET_BAN',
        scope: { banId: 'ban2' },
      }),
    ).toBe(false);
  });
  it('LOCALITY localityId lệch → false, thiếu → false', () => {
    expect(can(mk('LOCALITY', { localityId: 'dp1' }), 'create', { scope: { localityId: 'dp2' } })).toBe(
      false,
    );
    expect(can(mk('LOCALITY'), 'create', { scope: { localityId: 'dp1' } })).toBe(false);
  });
  it('ADMIN bỏ qua scope', () => {
    expect(can(mk('ADMIN'), 'edit', { scope: { banId: 'ban9', localityId: 'dp9' } })).toBe(true);
  });
  it('không truyền scope → không kiểm scope', () => {
    expect(can(mk('BAN_LEADER'), 'approve', { state: 'CHO_DUYET_BAN' })).toBe(true);
  });
});

describe('rolesForPath / canAccessRoute', () => {
  it('prefix khớp cơ bản', () => {
    expect(rolesForPath('/thi-dua/admin/bang-tieu-chi')).toEqual(['ADMIN']);
    expect(rolesForPath('/thi-dua/cham-diem/theo-tieu-chi/tc1')).toEqual(['SPECIALIST']);
  });
  it('prefix dài nhất thắng — lanh-dao-ban không nhầm sang hoi-dong', () => {
    expect(rolesForPath('/thi-dua/duyet/lanh-dao-ban/ban1')).toEqual(['BAN_LEADER']);
    expect(rolesForPath('/thi-dua/duyet/hoi-dong-tdkt')).toEqual(['COUNCIL_CHAIR', 'COUNCIL_VICE']);
  });
  it('lịch sử thay đổi KHÔNG có LOCALITY (B14)', () => {
    expect(rolesForPath('/thi-dua/lich-su-thay-doi/loc-1')).not.toContain('LOCALITY');
    expect(canAccessRoute('LOCALITY', '/thi-dua/lich-su-thay-doi/loc-1')).toBe(false);
    expect(canAccessRoute('ADMIN', '/thi-dua/lich-su-thay-doi/loc-1')).toBe(true);
  });
  it('path lạ → null / false', () => {
    expect(rolesForPath('/khong-ton-tai')).toBeNull();
    expect(canAccessRoute('ADMIN', '/khong-ton-tai')).toBe(false);
  });
});

describe('defaultRouteForRole', () => {
  it.each([
    ['ADMIN', '/thi-dua/dashboard-tong-quan'],
    ['SPECIALIST', '/thi-dua/dashboard-tong-quan'],
    ['LOCALITY', '/thi-dua/dia-phuong/trang-thai'],
    ['COUNCIL_CHAIR', '/thi-dua/duyet/hoi-dong-tdkt'],
    ['COUNCIL_VICE', '/thi-dua/duyet/hoi-dong-tdkt'],
    ['STANDING_COMMITTEE', '/thi-dua/duyet/ban-thuong-truc'],
  ] as Array<[Role, string]>)('%s → %s', (role, route) => {
    expect(defaultRouteForRole(role)).toBe(route);
  });
  it('BAN_LEADER dùng banId của user', () => {
    expect(defaultRouteForRole('BAN_LEADER', { banId: 'ban3' })).toBe(
      '/thi-dua/duyet/lanh-dao-ban/ban3',
    );
    expect(defaultRouteForRole('BAN_LEADER')).toBe('/thi-dua/duyet/lanh-dao-ban/ban1');
  });
});
