import { describe, expect, it } from 'vitest';
import { can, canAccessRoute, defaultRouteForRole, rolesForPath } from './rbac';
import type { AuthUser, Role } from '@/types/rbac';

const mk = (role: Role, extra: Partial<AuthUser> = {}): AuthUser => ({ id: 'u1', name: 'Người dùng', role, ...extra });

describe('RBAC năm vai trò', () => {
  it.each([
    ['LOCAL', 'submit', true], ['SPECIALIST', 'assign', true], ['LEADER', 'approve', true],
    ['COUNCIL', 'edit', false], ['COMMITTEE', 'publish', true], ['LOCAL', 'publish', false],
  ] as const)('%s %s = %s', (role, action, expected) => expect(can(mk(role), action)).toBe(expected));

  it('chỉ đúng vai trò được duyệt đúng chặng', () => {
    expect(can(mk('LEADER'), 'approve', { state: 'CHO_DUYET_BAN' })).toBe(true);
    expect(can(mk('COUNCIL'), 'approve', { state: 'CHO_DUYET_HOI_DONG' })).toBe(true);
    expect(can(mk('COMMITTEE'), 'publish', { state: 'CHO_DUYET_BTT' })).toBe(true);
    expect(can(mk('LEADER'), 'approve', { state: 'DRAFT' })).toBe(false);
  });

  it('kiểm scope cho địa phương và lãnh đạo', () => {
    expect(can(mk('LOCAL', { localityId: 'dp1' }), 'edit', { scope: { localityId: 'dp1' } })).toBe(true);
    expect(can(mk('LOCAL', { localityId: 'dp1' }), 'edit', { scope: { localityId: 'dp2' } })).toBe(false);
    expect(can(mk('LEADER', { banId: 'ban1' }), 'approve', { state: 'CHO_DUYET_BAN', scope: { banId: 'ban1' } })).toBe(true);
  });

  it('route guard dùng đúng năm vai trò', () => {
    expect(rolesForPath('/chuyen-vien/tieu-chi')).toEqual(['SPECIALIST']);
    expect(rolesForPath('/dia-phuong/tieu-chi')).toEqual(['LOCAL']);
    expect(canAccessRoute('COUNCIL', '/thi-dua/duyet/hoi-dong-tdkt')).toBe(true);
    expect(canAccessRoute('LOCAL', '/thi-dua/lich-su-thay-doi/loc-1')).toBe(false);
  });

  it.each([
    ['LOCAL', '/dia-phuong/tieu-chi'], ['SPECIALIST', '/chuyen-vien/duyet'],
    ['LEADER', '/thi-dua/duyet/lanh-dao-ban/ban1'], ['COUNCIL', '/thi-dua/duyet/hoi-dong-tdkt'],
    ['COMMITTEE', '/thi-dua/duyet/ban-thuong-truc'],
  ] as const)('điều hướng mặc định %s', (role, route) => expect(defaultRouteForRole(role, { banId: 'ban1' })).toBe(route));
});
