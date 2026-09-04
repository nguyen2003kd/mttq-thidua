import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/rbac';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (user: AuthUser, token: string, refreshToken: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      setAuth: (user, token, refreshToken) => set({ user, token, refreshToken }),
      clearAuth: () => set({ user: null, token: null, refreshToken: null }),
      isAuthenticated: () => get().token !== null,
    }),
    { name: 'thidua-auth' },
  ),
);
