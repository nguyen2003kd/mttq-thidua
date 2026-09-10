import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

const S = () => useAuthStore.getState();

beforeEach(() => {
  S().clearAuth();
});

describe('authStore', () => {
  it('mặc định chưa đăng nhập', () => {
    expect(S().user).toBeNull();
    expect(S().token).toBeNull();
    expect(S().isAuthenticated()).toBe(false);
  });

  it('setAuth lưu user + token + refreshToken', () => {
    S().setAuth({ id: 'u', name: 'X', role: 'SPECIALIST' }, 'tok', 'ref');
    expect(S().user?.role).toBe('SPECIALIST');
    expect(S().token).toBe('tok');
    expect(S().refreshToken).toBe('ref');
    expect(S().isAuthenticated()).toBe(true);
  });

  it('clearAuth xoá hết', () => {
    S().setAuth({ id: 'u', name: 'X', role: 'LOCAL', localityId: 'dp1' }, 'tok', 'ref');
    S().clearAuth();
    expect(S().user).toBeNull();
    expect(S().token).toBeNull();
    expect(S().refreshToken).toBeNull();
    expect(S().isAuthenticated()).toBe(false);
  });
});
