import { hashKey, matchQuery, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { getGetApiV1NotificationsQueryKey } from '@/api/endpoints/notifications';
import { getGetApiV1CriteriaGroupsQueryKey } from '@/api/endpoints/criteria-groups';
import { getGetApiV1SubmissionsQueryKey } from '@/api/endpoints/submissions';
import { apiQueryKey, invalidateQueryResources } from '@/api/mutator/query-keys';

// Use the same resource prefixes as the REST key factories, not separate SSE caches.
const resource = (name: string) => apiQueryKey({}, { url: `/api/v1/${name}` });
const submissions = [getGetApiV1SubmissionsQueryKey(), resource('submission-results')];
const criteria = [getGetApiV1CriteriaGroupsQueryKey(), resource('criteria'), ...submissions];
const publications = [resource('result-publications'), getGetApiV1CriteriaGroupsQueryKey(), ...submissions];

/** Notification types are generic SystemAlert; the business event is in data.eventType. */
export function notificationQueryKeys(data: string): QueryKey[] {
  const keys = [getGetApiV1NotificationsQueryKey()];
  try {
    const payload: unknown = JSON.parse(data);
    if (!payload || typeof payload !== 'object' || !('eventType' in payload)) return keys;
    switch (payload.eventType) {
      case 'criteria_added':
      case 'criteria_updated':
      case 'criteria_disabled':
      case 'supplementary_criteria_added':
        return [...keys, ...criteria, resource('files'), resource('audit-logs')];
      case 'criteria_group_applied':
      case 'criteria_group_updated':
        return [...keys, ...criteria, resource('departments'), resource('audit-logs')];
      case 'revision_requested':
      case 'specialist_review_requested':
      case 'reviewer_revision_requested':
      case 'scorer_revision_requested':
        return [...keys, ...submissions, resource('files'), resource('audit-logs')];
      case 'result_published':
        return [...keys, ...publications, resource('audit-logs')];
      default:
        // A reminder/unknown event does not mean unrelated business data changed.
        return keys;
    }
  } catch {
    return keys;
  }
}

/** Only reconcile domains whose SSE events may have been missed while disconnected. */
export const sseReconnectQueryKeys: readonly QueryKey[] = [
  getGetApiV1NotificationsQueryKey(), ...criteria, ...publications,
  resource('files'), resource('departments'), resource('audit-logs'),
];

/** Coalesce a burst into one invalidation; inactive caches stay stale until used. */
export function createSseQueryInvalidator(queryClient: QueryClient, delay = 250) {
  const pending = new Map<string, QueryKey>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flushing = false;
  let disposed = false;
  const schedule = () => {
    if (disposed || flushing || timer !== undefined || pending.size === 0) return;
    timer = setTimeout(() => {
      timer = undefined;
      void flush();
    }, delay);
  };
  const flush = async () => {
    flushing = true;
    const keysToInvalidate = [...pending.values()];
    pending.clear();
    try {
      const inFlight = queryClient.getQueryCache().findAll({
        predicate: (query) => query.state.fetchStatus === 'fetching'
          && keysToInvalidate.some((queryKey) => matchQuery({ queryKey }, query)),
      }).map((query) => query.promise);
      // A GET begun before the event may return old data. Let it settle, then fetch
      // once; restarting an uncancellable REST request would duplicate network work.
      if (inFlight.length > 0) await Promise.allSettled(inFlight);
      if (!disposed) await invalidateQueryResources(queryClient, keysToInvalidate, { cancelRefetch: false });
    } finally {
      flushing = false;
      schedule();
    }
  };
  return {
    enqueue(keys: readonly QueryKey[]) {
      if (disposed) return;
      for (const key of keys) pending.set(hashKey(key), key);
      schedule();
    },
    dispose() {
      disposed = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      pending.clear();
    },
  };
}
