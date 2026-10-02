import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSseQueryInvalidator, notificationQueryKeys, sseReconnectQueryKeys } from './sse-query-invalidation';

afterEach(() => vi.useRealTimers());

describe('SSE resource invalidation', () => {
  it.each(['revision_requested', 'specialist_review_requested', 'reviewer_revision_requested', 'scorer_revision_requested'])('maps %s to submission data/history/files', (eventType) => {
    const keys = notificationQueryKeys(JSON.stringify({ eventType, submissionId: 's1' }));
    expect(keys).toContainEqual(['submissions']);
    expect(keys).toContainEqual(['submission-results']);
    expect(keys).toContainEqual(['files']);
    expect(keys).not.toContainEqual(['users']);
  });

  it.each(['criteria_added', 'criteria_updated', 'criteria_disabled', 'supplementary_criteria_added', 'criteria_group_applied', 'criteria_group_updated'])('refreshes criteria and score projections on %s', (eventType) => {
    const keys = notificationQueryKeys(JSON.stringify({ eventType }));
    expect(keys).toContainEqual(['criteria-groups']);
    expect(keys).toContainEqual(['submissions']);
  });

  it('publication includes local and admin publication queries under the same root', () => {
    const keys = notificationQueryKeys('{"eventType":"result_published"}');
    expect(keys).toContainEqual(['result-publications']);
    expect(keys).toContainEqual(['criteria-groups']);
  });

  it.each(['not-json', '{}', '{"eventType":"submission_reminder"}', '{"eventType":"unknown"}'])('does not refetch unrelated resources for %s', (data) => {
    expect(notificationQueryKeys(data)).toEqual([['notifications']]);
  });

  it('coalesces bursts and does not restart in-flight requests', async () => {
    vi.useFakeTimers();
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const queue = createSseQueryInvalidator(client);
    queue.enqueue(notificationQueryKeys('{"eventType":"revision_requested"}'));
    queue.enqueue(notificationQueryKeys('{"eventType":"criteria_updated"}'));
    queue.enqueue(sseReconnectQueryKeys);
    expect(invalidate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(250);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ refetchType: 'active' }), { cancelRefetch: false });
    queue.dispose();
    client.clear();
  });

  it('cancels queued invalidation when the connection owner unmounts', async () => {
    vi.useFakeTimers();
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const queue = createSseQueryInvalidator(client);
    queue.enqueue([['submissions']]);
    queue.dispose();
    await vi.advanceTimersByTimeAsync(500);
    expect(invalidate).not.toHaveBeenCalled();
    client.clear();
  });

  it('waits for an older request, then refreshes without overlapping HTTP work', async () => {
    vi.useFakeTimers();
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: 120_000 } } });
    const key = ['submissions'];
    client.setQueryData(key, 'cached');
    let resolveOld!: (data: string) => void;
    const fetchData = vi.fn()
      .mockImplementationOnce(() => new Promise<string>((resolve) => { resolveOld = resolve; }))
      .mockResolvedValue('after-event');
    const observer = new QueryObserver(client, { queryKey: key, queryFn: fetchData });
    const unsubscribe = observer.subscribe(() => undefined);
    const olderRequest = client.invalidateQueries({ queryKey: key });
    const queue = createSseQueryInvalidator(client);
    try {
      queue.enqueue([key]);
      await vi.advanceTimersByTimeAsync(250);
      expect(fetchData).toHaveBeenCalledTimes(1);
      resolveOld('before-event');
      await olderRequest;
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchData).toHaveBeenCalledTimes(2);
      expect(client.getQueryData(key)).toBe('after-event');
    } finally {
      queue.dispose();
      unsubscribe();
      client.clear();
    }
  });
});
