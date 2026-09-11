import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import { installAuthInterceptors } from './auth-interceptors';

interface InterceptorHarness {
  instance: AxiosInstance;
  requestFulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  responseRejected: (error: AxiosError) => Promise<unknown>;
  retry: ReturnType<typeof vi.fn>;
}

function createJwt(exp: number): string {
  const payload = btoa(JSON.stringify({ exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${payload}.signature`;
}

function createHarness(): InterceptorHarness {
  let requestFulfilled!: InterceptorHarness['requestFulfilled'];
  let responseRejected!: InterceptorHarness['responseRejected'];
  const retry = vi.fn().mockResolvedValue({ data: { retried: true } });

  const instance = {
    interceptors: {
      request: {
        use: vi.fn((fulfilled: InterceptorHarness['requestFulfilled']) => {
          requestFulfilled = fulfilled;
        }),
      },
      response: {
        use: vi.fn(
          (
            _fulfilled: (response: AxiosResponse) => AxiosResponse,
            rejected: InterceptorHarness['responseRejected'],
          ) => {
            responseRejected = rejected;
          },
        ),
      },
    },
    request: retry,
  } as unknown as AxiosInstance;

  installAuthInterceptors(instance);
  return { instance, requestFulfilled, responseRejected, retry };
}

function unauthorizedError(url: string): AxiosError {
  const config = {
    url,
    method: 'get',
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig;

  return new axios.AxiosError(
    'Unauthorized',
    'ERR_BAD_REQUEST',
    config,
    undefined,
    {
      data: {},
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config,
    },
  );
}

describe('auth interceptors', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth(
      { id: 'user-1', name: 'Local user', role: 'LOCAL' },
      'expired-access-token',
      'current-refresh-token',
    );
  });

  it('gắn access token hiện tại vào request', () => {
    const { requestFulfilled } = createHarness();
    const config = {
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig;

    const result = requestFulfilled(config);

    expect(result.headers.get('Authorization')).toBe('Bearer expired-access-token');
  });

  it('chỉ refresh một lần khi nhiều request cùng trả 401 rồi gửi lại tất cả request', async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const newAccessToken = createJwt(expiresAt);
    const newRefreshToken = createJwt(expiresAt + 86400);
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      },
    });
    const { responseRejected, retry } = createHarness();

    await Promise.all([
      responseRejected(unauthorizedError('/api/v1/criteria-groups')),
      responseRejected(unauthorizedError('/api/v1/my-submissions')),
    ]);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/refresh'),
      { refreshToken: 'current-refresh-token' },
      expect.objectContaining({ withCredentials: true }),
    );
    expect(retry).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().token).toBe(newAccessToken);
    expect(useAuthStore.getState().refreshToken).toBe(newRefreshToken);
  });

  it('xóa phiên và phát sự kiện đăng xuất khi refresh thất bại', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Invalid refresh token'));
    const logoutListener = vi.fn();
    window.addEventListener('auth:logout', logoutListener);
    const { responseRejected, retry } = createHarness();

    await expect(
      responseRejected(unauthorizedError('/api/v1/criteria-groups')),
    ).rejects.toThrow('Invalid refresh token');

    expect(retry).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(logoutListener).toHaveBeenCalledTimes(1);
    window.removeEventListener('auth:logout', logoutListener);
  });

  it('dùng token vừa được request khác làm mới mà không refresh lần hai', async () => {
    const postSpy = vi.spyOn(axios, 'post');
    const { responseRejected, retry } = createHarness();
    const error = unauthorizedError('/api/v1/criteria-groups');
    error.config?.headers.set('Authorization', 'Bearer expired-access-token');
    useAuthStore.getState().setStore({ access_token: 'already-refreshed-token' });

    await responseRejected(error);

    expect(postSpy).not.toHaveBeenCalled();
    expect(retry).toHaveBeenCalledTimes(1);
    expect(error.config?.headers.get('Authorization')).toBe(
      'Bearer already-refreshed-token',
    );
  });

  it('không refresh khi chính endpoint đăng nhập trả 401', async () => {
    const postSpy = vi.spyOn(axios, 'post');
    const { responseRejected } = createHarness();
    const error = unauthorizedError('/api/v1/auth/login/web');

    await expect(responseRejected(error)).rejects.toBe(error);

    expect(postSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBe('expired-access-token');
  });
});
