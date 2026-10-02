import { describe, expect, it } from 'vitest';
import { queryClient } from './query-client';

describe('queryClient defaults', () => {
  it('refetches stale queries on focus, reconnect and mount without polling', () => {
    const queries = queryClient.getDefaultOptions().queries;

    expect(queries).toMatchObject({
      staleTime: 2 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    });
    expect(queries).not.toHaveProperty('refetchInterval');
  });
});
