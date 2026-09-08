import { create, type StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/rbac';
// App
import { createStorage } from '../utils/storage'
export interface AuthSession {
  id: string | null;
  expires_at: string | null;
  refresh_expires_at: string | null;
}

export interface States {
  isSignedIn: boolean;
  id: string | null;
  email: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  roles: string[] | null;
  permissions: string[] | null;
  status: string | null;
  last_login_at: string | null;
  session: AuthSession | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_in: number | null;
  refresh_expires_in:number|null;
  token_type: string | null;
  access_token_expires_at: Date | null;
  refresh_token_expires_at: Date | null;
  storedUsername: string | null;
  storedPassword: string | null;
  _hasHydrated: boolean;

  /** Compatibility fields for the existing thi đua UI. */
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
}

export interface SetStoreActionValues {
  isSignedIn?: States['isSignedIn'];
  id?: States['id'];
  email?: States['email'];
  username?: States['username'];
  first_name?: States['first_name'];
  last_name?: States['last_name'];
  roles?: States['roles'];
  permissions?: States['permissions'];
  status?: States['status'];
  last_login_at?: States['last_login_at'];
  session?: States['session'];
  access_token?: States['access_token'];
  refresh_token?: States['refresh_token'];
  expires_in?: States['expires_in'];
  refresh_expires_in?:States['refresh_expires_in'];
  token_type?: States['token_type'];
  access_token_expires_at?: States['access_token_expires_at'];
  refresh_token_expires_at?: States['refresh_token_expires_at'];
  storedUsername?: States['storedUsername'];
  storedPassword?: States['storedPassword'];
  user?: States['user'];
}

interface Actions {
  setStore: (values: SetStoreActionValues) => void;
  resetStore: () => void;
  setHasHydrated: (hasHydrated?: boolean) => void;
  /** Compatibility action; prefer setStore for new code. */
  setAuth: (user: AuthUser, token: string, refreshToken: string) => void;
  /** Compatibility action; prefer resetStore for new code. */
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

type Store = States & Actions;

export const authStoreName = 'thidua-auth';

const INITIAL_STATES: States = {
  isSignedIn: false,
  id: null,
  email: null,
  username: null,
  first_name: null,
  last_name: null,
  roles: null,
  permissions: null,
  status: null,
  last_login_at: null,
  session: null,
  access_token: null,
  refresh_token: null,
  expires_in: null,
  token_type: null,
  access_token_expires_at: null,
  refresh_token_expires_at: null,
  storedUsername: null,
  storedPassword: null,
  refresh_expires_in:null,
  _hasHydrated: false,
  user: null,
  token: null,
  refreshToken: null,
};

const authStore: StateCreator<Store> = (set, get) => ({
  ...INITIAL_STATES,

  setStore: (values) =>
    set((state) => {
      const next = { ...state, ...values };
      const accessToken = values.access_token === undefined ? state.access_token : values.access_token;
      const refreshToken = values.refresh_token === undefined ? state.refresh_token : values.refresh_token;
      const user = values.user === undefined ? state.user : values.user;

      return {
        ...next,
        isSignedIn: values.isSignedIn ?? Boolean(user),
        token: accessToken,
        refreshToken,
      };
    }),

  resetStore: () => set({ ...INITIAL_STATES, _hasHydrated: get()._hasHydrated }),
  setHasHydrated: (hasHydrated = true) => set({ _hasHydrated: hasHydrated }),

  setAuth: (user, token, refreshToken) =>
    set({
      isSignedIn: true,
      user,
      id: user.id,
      username: user.name,
      roles: [user.role],
      access_token: token,
      refresh_token: refreshToken,
      token,
      refreshToken,
    }),

  clearAuth: () => set({ ...INITIAL_STATES, _hasHydrated: get()._hasHydrated }),
  isAuthenticated: () => get().isSignedIn,
});

export const useAuthStore = create<Store>()(
  devtools(
    persist(authStore, {
      name: authStoreName,
      storage: createStorage<Partial<States>>(),
      partialize: (state) => ({
        isSignedIn: state.isSignedIn,
        id: state.id,
        email: state.email,
        username: state.username,
        first_name: state.first_name,
        last_name: state.last_name,
        roles: state.roles,
        permissions: state.permissions,
        status: state.status,
        last_login_at: state.last_login_at,
        session: state.session,
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        expires_in: state.expires_in,
        token_type: state.token_type,
        access_token_expires_at: state.access_token_expires_at,
        refresh_token_expires_at: state.refresh_token_expires_at,
        storedUsername: state.storedUsername,
        refresh_expires_in:state.refresh_expires_in,
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<States>;

        return {
          ...currentState,
          ...persisted,
          access_token_expires_at: persisted.access_token_expires_at
            ? new Date(persisted.access_token_expires_at)
            : null,
          refresh_token_expires_at: persisted.refresh_token_expires_at
            ? new Date(persisted.refresh_token_expires_at)
            : null,
        };
      },
      onRehydrateStorage: () => (state) => state?.setHasHydrated(),
    }),
    { name: authStoreName },
  ),
);

export default useAuthStore;
