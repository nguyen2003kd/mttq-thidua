import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import baseConfig from '@/configs/base';
import { useAuthStore } from '@/store/authStore';

interface RefreshTokenEnvelope {
  success: boolean;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  } | null;
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retryAfterRefresh?: boolean;
}

let refreshPromise: Promise<string> | null = null;
let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let stopProactiveRefresh: (() => void) | null = null;

/** Refresh shortly before expiry so active users do not encounter a 401. */
const PROACTIVE_REFRESH_LEEWAY_MS = 60_000;

function tokenExpiresAt(token: string): Date | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof decoded.exp === 'number' ? new Date(decoded.exp * 1000) : null;
  } catch {
    return null;
  }
}

function isRefreshExcluded(url?: string): boolean {
  if (!url) return false;

  return [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout',
    '/api/v1/auth/forgot-password',
  ].some((path) => url.includes(path));
}

function clearSession(): void {
  const state = useAuthStore.getState();
  const hadSession = Boolean(state.token || state.refreshToken || state.user);
  state.clearAuth();

  if (hadSession && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:logout'));
  }
}

async function requestNewAccessToken(): Promise<string> {
  const currentRefreshToken = useAuthStore.getState().refreshToken;
  if (!currentRefreshToken) {
    throw new Error('Refresh token is missing');
  }

  const baseUrl = baseConfig.backendDomain.replace(/\/$/, '');
  const response = await axios.post<RefreshTokenEnvelope>(
    `${baseUrl}/api/v1/auth/refresh`,
    { refreshToken: currentRefreshToken },
    {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    },
  );

  const accessToken = response.data.data?.accessToken;
  const refreshToken = response.data.data?.refreshToken;
  if (!response.data.success || !accessToken || !refreshToken) {
    throw new Error('Refresh token response is invalid');
  }

  const accessTokenExpiresAt = tokenExpiresAt(accessToken);
  const refreshTokenExpiresAt = tokenExpiresAt(refreshToken);
  const now = Date.now();

  useAuthStore.getState().setStore({
    access_token: accessToken,
    refresh_token: refreshToken,
    access_token_expires_at: accessTokenExpiresAt,
    refresh_token_expires_at: refreshTokenExpiresAt,
    expires_in: accessTokenExpiresAt
      ? Math.max(0, Math.floor((accessTokenExpiresAt.getTime() - now) / 1000))
      : null,
    refresh_expires_in: refreshTokenExpiresAt
      ? Math.max(0, Math.floor((refreshTokenExpiresAt.getTime() - now) / 1000))
      : null,
  });

  return accessToken;
}

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function clearProactiveRefreshTimer(): void {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
}

function scheduleProactiveRefresh(): void {
  clearProactiveRefreshTimer();

  const { token, refreshToken, access_token_expires_at: storedExpiry } = useAuthStore.getState();
  if (!token || !refreshToken) return;

  const expiresAt = storedExpiry ?? tokenExpiresAt(token);
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) return;

  const delay = Math.max(0, expiresAt.getTime() - Date.now() - PROACTIVE_REFRESH_LEEWAY_MS);
  proactiveRefreshTimer = setTimeout(() => {
    proactiveRefreshTimer = null;
    void refreshAccessToken().catch(() => clearSession());
  }, delay);
}

/**
 * Starts one application-wide schedule that rotates the access token one minute
 * before its JWT expiry. The existing 401 retry remains a fallback for requests
 * made while a token is being rotated or from a stale browser tab.
 */
export function startProactiveTokenRefresh(): () => void {
  if (stopProactiveRefresh) return stopProactiveRefresh;

  const unsubscribe = useAuthStore.subscribe(() => {
    scheduleProactiveRefresh();
  });

  scheduleProactiveRefresh();

  const stop = () => {
    unsubscribe();
    clearProactiveRefreshTimer();
    if (stopProactiveRefresh === stop) {
      stopProactiveRefresh = null;
    }
  };

  stopProactiveRefresh = stop;
  return stop;
}

export function installAuthInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const accessToken = useAuthStore.getState().token;
    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const requestConfig = error.config as RetriableRequestConfig | undefined;

      if (error.response?.status !== 401 || isRefreshExcluded(requestConfig?.url)) {
        return Promise.reject(error);
      }

      if (!requestConfig || requestConfig._retryAfterRefresh) {
        clearSession();
        return Promise.reject(error);
      }

      requestConfig._retryAfterRefresh = true;

      // A different request may already have completed the token rotation by
      // the time this 401 arrives. Retry with that token instead of rotating
      // the refresh token a second time.
      const latestAccessToken = useAuthStore.getState().token;
      const requestAuthorization = requestConfig.headers.get('Authorization');
      if (
        latestAccessToken &&
        requestAuthorization &&
        requestAuthorization !== `Bearer ${latestAccessToken}`
      ) {
        requestConfig.headers.set('Authorization', `Bearer ${latestAccessToken}`);
        return instance.request(requestConfig);
      }

      try {
        const accessToken = await refreshAccessToken();
        requestConfig.headers.set('Authorization', `Bearer ${accessToken}`);
        return await instance.request(requestConfig);
      } catch (refreshError) {
        clearSession();
        return Promise.reject(refreshError);
      }
    },
  );
}
