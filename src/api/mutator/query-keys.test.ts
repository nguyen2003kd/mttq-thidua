import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { getGetApiV1UsersQueryKey, getGetApiV1UsersIdQueryKey } from '@/api/endpoints/users';
import { getGetApiV1MySubmissionsQueryKey, getGetApiV1CriteriaGroupsGroupIdSubmissionsQueryKey } from '@/api/endpoints/submissions';
import { apiQueryKey, dataQueryKey, invalidateQueryResources } from './query-keys';
import { queryClient as appQueryClient } from './query-client';

const createClient = () => new QueryClient({ defaultOptions: appQueryClient.getDefaultOptions() });

describe('resource query keys', () => {
  it('keeps existing factories with list/detail prefixes and parameter variants', () => {
    expect(getGetApiV1UsersQueryKey()).toEqual(['users']);
    expect(getGetApiV1UsersIdQueryKey('user-1')).toEqual(['users', 'user-1']);
    expect(apiQueryKey({ params: { Page: 2 } }, { url: '/api/v1/users' })).toEqual(['users', { Page: 2 }]);
    expect(getGetApiV1MySubmissionsQueryKey()).toEqual(['submissions', 'mine']);
    expect(getGetApiV1CriteriaGroupsGroupIdSubmissionsQueryKey('group-1')).toEqual(['submissions', 'by-group', 'group-1']);
  });

  it('separates generated response envelopes from unwrapped feature data', () => {
    expect(dataQueryKey(getGetApiV1UsersIdQueryKey('user-1'))).toEqual(['users', 'user-1', 'data']);
    expect(dataQueryKey(getGetApiV1UsersQueryKey(), { page: 1 })).not.toEqual(getGetApiV1UsersQueryKey());
  });

  it('invalidates overlapping list/detail prefixes once and leaves inactive data stale', async () => {
    const client = createClient();
    const list = dataQueryKey(getGetApiV1UsersQueryKey(), { page: 1 });
    const detail = dataQueryKey(getGetApiV1UsersIdQueryKey('user-1'));
    client.setQueryData(list, ['old']);
    client.setQueryData(detail, { name: 'old' });
    client.setQueryData(['periods'], []);
    const fetchList = vi.fn(async () => ['new']);
    const observer = new QueryObserver(client, { queryKey: list, queryFn: fetchList });
    const unsubscribe = observer.subscribe(() => undefined);
    try {
      expect(fetchList).not.toHaveBeenCalled();
      await invalidateQueryResources(client, [getGetApiV1UsersQueryKey(), getGetApiV1UsersIdQueryKey('user-1')]);
      expect(fetchList).toHaveBeenCalledTimes(1);
      expect(client.getQueryData(list)).toEqual(['new']);
      expect(client.getQueryState(detail)?.isInvalidated).toBe(true);
      expect(client.getQueryState(['periods'])?.isInvalidated).toBe(false);
    } finally {
      unsubscribe();
      client.clear();
    }
  });

  it('does not cancel and duplicate an older REST request after a mutation', async () => {
    const client = createClient();
    const key = ['users'];
    client.setQueryData(key, 'cached');
    let resolveOld!: (data: string) => void;
    const fetchUsers = vi.fn()
      .mockImplementationOnce(() => new Promise<string>((resolve) => { resolveOld = resolve; }))
      .mockResolvedValue('after-mutation');
    const observer = new QueryObserver(client, { queryKey: key, queryFn: fetchUsers });
    const unsubscribe = observer.subscribe(() => undefined);
    const olderRequest = client.invalidateQueries({ queryKey: key });
    try {
      const refresh = invalidateQueryResources(client, [key]);
      expect(fetchUsers).toHaveBeenCalledTimes(1);
      resolveOld('before-mutation');
      await Promise.all([olderRequest, refresh]);
      expect(fetchUsers).toHaveBeenCalledTimes(2);
      expect(client.getQueryData(key)).toBe('after-mutation');
    } finally {
      unsubscribe();
      client.clear();
    }
  });
});

describe('stale-only lifecycle refetch', () => {
  it.each(['focus', 'reconnect'] as const)('refetches stale, not fresh, active data on %s', async (trigger) => {
    const client = createClient();
    const key = ['users'];
    client.setQueryData(key, ['cached']);
    const fetchUsers = vi.fn(async () => ['updated']);
    const observer = new QueryObserver(client, { queryKey: key, queryFn: fetchUsers });
    const unsubscribe = observer.subscribe(() => undefined);
    const fire = () => trigger === 'focus' ? client.getQueryCache().onFocus() : client.getQueryCache().onOnline();
    try {
      fire();
      expect(fetchUsers).not.toHaveBeenCalled();
      client.setQueryData(key, ['cached'], { updatedAt: Date.now() - 121_000 });
      fire();
      await client.getQueryCache().find({ queryKey: key })?.promise;
      expect(fetchUsers).toHaveBeenCalledTimes(1);
      expect(client.getQueryData(key)).toEqual(['updated']);
    } finally {
      unsubscribe();
      client.clear();
    }
  });

  it.each([false, true])('only fetches cached data on mount when stale=%s', async (stale) => {
    const client = createClient();
    const key = ['users'];
    client.setQueryData(key, ['cached'], { updatedAt: Date.now() - (stale ? 121_000 : 0) });
    const fetchUsers = vi.fn(async () => ['updated']);
    const observer = new QueryObserver(client, { queryKey: key, queryFn: fetchUsers });
    const unsubscribe = observer.subscribe(() => undefined);
    try {
      await client.getQueryCache().find({ queryKey: key })?.promise;
      expect(fetchUsers).toHaveBeenCalledTimes(stale ? 1 : 0);
    } finally {
      unsubscribe();
      client.clear();
    }
  });
});
