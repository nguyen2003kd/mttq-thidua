import { QueryClient } from "@tanstack/react-query";

/**
 * The single query client used by both the React provider and API mutations.
 * Keeping this instance here makes cache invalidation work for generated Orval
 * calls as well as API helpers which call `mainInstance` directly.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Marks every API-backed query stale. Active queries refetch immediately,
 * while inactive ones fetch the next time their screen is opened.
 */
export const invalidateApiQueries = () => queryClient.invalidateQueries();

export default queryClient;
