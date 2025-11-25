import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // 0 = data is immediately stale, always fetch fresh data for instant updates
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for instant display while fetching
      retry: 1, // Retry once for faster failure detection
      retryDelay: (attemptIndex) => Math.min(300 * 2 ** attemptIndex, 3000), // Faster exponential backoff (max 3s)
      refetchOnWindowFocus: false, // Don't refetch on focus to reduce unnecessary requests
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Always refetch on mount for fresh data (no delay)
      refetchInterval: false, // Disable automatic polling (use socket for real-time updates)
      // Enable structural sharing to prevent unnecessary re-renders
      structuralSharing: true,
      // Network mode optimization
      networkMode: 'online', // Only refetch when online
      // Optimize for instant data fetching
      placeholderData: (previousData) => previousData, // Show cached data instantly while fetching
    },
    mutations: {
      retry: 0, // Don't retry mutations - fail fast for better UX
      networkMode: 'online',
    },
  },
});

