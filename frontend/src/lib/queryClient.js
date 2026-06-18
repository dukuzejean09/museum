import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes — WebSocket events invalidate sooner
      gcTime: 30 * 60 * 1000,     // Keep unused data in cache for 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,    // Refetch when network reconnects
    },
  },
});

export default queryClient;
