import { QueryClient } from "@tanstack/react-query";

/**
 * The single QueryClient used by the React provider and mutation callbacks.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
  },
});

export default queryClient;
