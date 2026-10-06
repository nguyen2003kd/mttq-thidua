import type { ReactNode } from 'react';
import { TextDecoder, TextEncoder } from 'node:util';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider, QueryObserver, type QueryKey } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { notificationsApi } from '@/features/notifications/api/notificationsApi';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore, type SseNotification } from '@/store/notificationStore';
import { useSseNotifications } from './useSseNotifications';

vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));
vi.mock('@/features/notifications/api/notificationsApi', () => ({
  notificationsApi: { unreadCount: vi.fn() },
}));

const fetchMock = vi.fn();
const clients: QueryClient[] = [];
const subscriptions: Array<() => void> = [];
const submissionKey = ['submissions', 'submission-1', 'data'] as const;
const notificationKey = ['notifications', 'data'] as const;
const usersKey = ['users', 'data'] as const;
const publicationKey = ['result-publications', 'overview', 'data', 'period-1'] as const;

/** An in-memory SSE reader: messages arrive only when the test explicitly sends them. */
function createStream() {
  type ReadResult = ReadableStreamReadResult<Uint8Array>;
  const queued: ReadResult[] = [];
  let pending: ((value: ReadResult) => void) | undefined;
  const deliver = (result: ReadResult) => {
    if (pending) {
      const resolve = pending;
      pending = undefined;
      resolve(result);
    } else {
      queued.push(result);
    }
  };
  const read = vi.fn(() => new Promise<ReadResult>((resolve) => {
    const next = queued.shift();
    if (next) resolve(next);
    else pending = resolve;
  }));

  return {
    response: { ok: true, status: 200, body: { getReader: () => ({ read }) } } as unknown as Response,
    send: (text: string) => deliver({ done: false, value: new TextEncoder().encode(text) }),
    close: () => deliver({ done: true, value: undefined }),
  };
}

function notificationFrame(id: string, eventType = 'revision_requested') {
  const notification: SseNotification = {
    id,
    title: 'Hồ sơ cần chỉnh sửa',
    body: 'Vui lòng đối chiếu lại minh chứng.',
    type: 'SystemAlert',
    data: JSON.stringify({ eventType, submissionId: 'submission-1' }),
    createdAt: '2026-10-01T08:00:00Z',
  };
  return `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
}

function createClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 120_000, gcTime: Infinity } },
  });
  clients.push(client);
  return client;
}

function observeQuery(client: QueryClient, queryKey: QueryKey) {
  client.setQueryData(queryKey, 'initial');
  const queryFn = vi.fn().mockResolvedValue('updated');
  const observer = new QueryObserver(client, { queryKey, queryFn });
  subscriptions.push(observer.subscribe(() => undefined));
  return queryFn;
}

function mountHook(client: QueryClient) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return renderHook(() => useSseNotifications(), { wrapper: Wrapper });
}

async function settle() {
  await act(async () => { await Promise.resolve(); });
}

async function advanceTime(milliseconds: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-01T08:00:00Z'));
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('TextDecoder', TextDecoder);
  vi.mocked(toast.info).mockClear();
  vi.mocked(notificationsApi.unreadCount).mockResolvedValue({ count: 0 });
  useAuthStore.setState({ isSignedIn: true, token: 'test-token' });
  useNotificationStore.getState().clear();
});

afterEach(() => {
  cleanup();
  subscriptions.splice(0).forEach((unsubscribe) => unsubscribe());
  clients.splice(0).forEach((client) => client.clear());
  useAuthStore.getState().resetStore();
  useNotificationStore.getState().clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useSseNotifications cache refresh', () => {
  it('refreshes related active data without invalidating unrelated caches', async () => {
    const stream = createStream();
    fetchMock.mockResolvedValue(stream.response);
    const client = createClient();
    const fetchSubmission = observeQuery(client, submissionKey);
    client.setQueryData(notificationKey, 'notifications');
    client.setQueryData(usersKey, 'users');
    client.setQueryData(publicationKey, 'publication');
    mountHook(client);
    await settle();

    await act(async () => { stream.send(notificationFrame('notification-1')); });
    expect(fetchSubmission).not.toHaveBeenCalled();
    await advanceTime(250);

    expect(fetchSubmission).toHaveBeenCalledTimes(1);
    expect(client.getQueryState(notificationKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(usersKey)?.isInvalidated).toBe(false);
    expect(client.getQueryState(publicationKey)?.isInvalidated).toBe(false);
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(toast.info).toHaveBeenCalledTimes(1);
  });

  it('coalesces a burst and ignores replayed notification IDs', async () => {
    const stream = createStream();
    fetchMock.mockResolvedValue(stream.response);
    const client = createClient();
    const fetchSubmission = observeQuery(client, submissionKey);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    mountHook(client);
    await settle();

    await act(async () => {
      stream.send(notificationFrame('notification-1') + notificationFrame('notification-1') + notificationFrame('notification-2'));
    });
    await advanceTime(250);

    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(fetchSubmission).toHaveBeenCalledTimes(1);
    expect(useNotificationStore.getState().notifications).toHaveLength(2);
    expect(toast.info).toHaveBeenCalledTimes(2);
  });

  it('reconciles after reconnect but does not refresh business data on initial connect', async () => {
    const firstStream = createStream();
    const secondStream = createStream();
    fetchMock.mockResolvedValueOnce(firstStream.response).mockResolvedValueOnce(secondStream.response);
    const client = createClient();
    const fetchSubmission = observeQuery(client, submissionKey);
    const fetchUsers = observeQuery(client, usersKey);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    mountHook(client);
    await settle();
    await advanceTime(250);

    expect(invalidate).not.toHaveBeenCalled();
    expect(fetchSubmission).not.toHaveBeenCalled();
    expect(useNotificationStore.getState().connected).toBe(true);

    await act(async () => { firstStream.close(); });
    await advanceTime(1_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchSubmission).not.toHaveBeenCalled();
    await advanceTime(250);

    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(fetchSubmission).toHaveBeenCalledTimes(1);
    expect(fetchUsers).not.toHaveBeenCalled();
  });

  it('aborts the stream and cancels queued refreshes when unmounted', async () => {
    const stream = createStream();
    fetchMock.mockResolvedValue(stream.response);
    const client = createClient();
    const fetchSubmission = observeQuery(client, submissionKey);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { unmount } = mountHook(client);
    await settle();
    await act(async () => { stream.send(notificationFrame('notification-1')); });
    const requestOptions = fetchMock.mock.calls[0][1] as RequestInit;

    unmount();
    await act(async () => { stream.close(); });
    await advanceTime(30_000);

    expect(requestOptions.signal?.aborted).toBe(true);
    expect(invalidate).not.toHaveBeenCalled();
    expect(fetchSubmission).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useNotificationStore.getState().connected).toBe(false);
  });
});
