import { QueryClient } from '@tanstack/react-query';

import { QUERY } from '@/config/constants';

/** Single QueryClient for the app. Server state lives here — never in Zustand. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY.staleTimeMs,
      gcTime: QUERY.gcTimeMs,
      retry: QUERY.retry,
      refetchOnWindowFocus: false,
    },
  },
});
