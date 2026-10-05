import { matchQuery, type InvalidateOptions, type QueryClient, type QueryKey } from '@tanstack/react-query';

/** Shared by the existing generated key factories and Orval on regeneration. */
export function apiQueryKey(properties: Record<string, unknown>, context: { url: string; queryOptions?: unknown }): QueryKey {
  const path = context.url.split('?')[0].replace(/^\/api\/v\d+\//, '').replace(/^\/+|\/+$/g, '');
  const segments = path.split('/');
  let key: QueryKey = segments;

  // These endpoints are different views of the same submission resource.
  if (segments[0] === 'my-submissions') {
    key = ['submissions', 'mine', ...segments.slice(1)];
  } else if (segments[0] === 'criteria-groups' && segments[2] === 'submissions') {
    key = ['submissions', 'by-group', segments[1], ...segments.slice(3)];
  }

  return properties.params === undefined ? key : [...key, properties.params];
}

/** Feature APIs unwrap the envelope; generated hooks cache the full response. */
export function dataQueryKey(key: QueryKey, ...variants: readonly unknown[]): QueryKey {
  return [...key, 'data', ...variants];
}

/** Match each affected query once, even when both a parent and detail are supplied. */
export async function invalidateQueryResources(queryClient: QueryClient, keys: readonly QueryKey[], options?: InvalidateOptions): Promise<void> {
  const filters = {
    predicate: (query: Parameters<typeof matchQuery>[1]) => keys.some((queryKey) => matchQuery({ queryKey }, query)),
  };
  // Feature GETs do not all consume AbortSignal. A refresh already in flight
  // must finish before invalidation, rather than cancelling and duplicating it.
  const inFlight = queryClient.getQueryCache().findAll(filters)
    .filter((query) => query.state.fetchStatus === 'fetching')
    .map((query) => query.promise);
  if (inFlight.length > 0) await Promise.allSettled(inFlight);
  return queryClient.invalidateQueries({
    ...filters,
    refetchType: 'active',
  }, { cancelRefetch: false, ...options });
}
