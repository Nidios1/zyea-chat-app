/**
 * Utility functions for optimized data fetching
 * - Parallel requests
 * - Prefetching
 * - Request batching
 */

import { QueryClient } from '@tanstack/react-query';
import { 
  chatAPI, 
  friendsAPI, 
  newsfeedAPI, 
  notificationsAPI, 
  usersAPI 
} from './api';

/**
 * Prefetch multiple queries in parallel for faster initial load
 */
export const prefetchInitialData = async (queryClient: QueryClient, userId?: string) => {
  if (!userId) return;

  // Fetch all critical data in parallel
  const prefetchPromises = [
    // Conversations - cache 1 minute
    queryClient.prefetchQuery({
      queryKey: ['conversations'],
      queryFn: async () => {
        const res = await chatAPI.getConversations();
        return Array.isArray(res.data) ? res.data : (res.data?.conversations || []);
      },
      staleTime: 60 * 1000, // 1 minute
    }),

    // Following list - cache 2 minutes
    queryClient.prefetchQuery({
      queryKey: ['following'],
      queryFn: async () => {
        const res = await friendsAPI.getFollowing();
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    }),

    // Posts feed - cache 30 seconds
    queryClient.prefetchQuery({
      queryKey: ['posts', 'all'],
      queryFn: async () => {
        const res = await newsfeedAPI.getPosts(1, 'all');
        return Array.isArray(res.data) ? res.data : (res.data?.posts || []);
      },
      staleTime: 30 * 1000, // 30 seconds
    }),

    // Notifications - cache 1 minute
    queryClient.prefetchQuery({
      queryKey: ['notifications'],
      queryFn: async () => {
        const res = await notificationsAPI.getNotifications();
        return Array.isArray(res.data) ? res.data : (res.data?.notifications || []);
      },
      staleTime: 60 * 1000, // 1 minute
    }),

    // User profile - cache 2 minutes
    queryClient.prefetchQuery({
      queryKey: ['userProfile', userId],
      queryFn: async () => {
        const res = await usersAPI.getProfile(userId);
        return res.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    }),
  ];

  // Execute all in parallel, don't wait for all to complete
  Promise.allSettled(prefetchPromises).catch(() => {
    // Silently fail - prefetch is optional
  });
};

/**
 * Fetch multiple data sources in parallel
 */
export const fetchParallelData = async <T extends Record<string, Promise<any>>>(
  requests: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> => {
  const keys = Object.keys(requests) as Array<keyof T>;
  const promises = keys.map(key => requests[key]);
  
  const results = await Promise.allSettled(promises);
  
  const data: any = {};
  keys.forEach((key, index) => {
    const result = results[index];
    if (result.status === 'fulfilled') {
      data[key] = result.value;
    } else {
      // Return null for failed requests
      data[key] = null;
    }
  });
  
  return data;
};

/**
 * Batch invalidate queries efficiently
 */
export const batchInvalidateQueries = (
  queryClient: QueryClient,
  queryKeys: string[][]
) => {
  // Use startTransition for better performance
  queryKeys.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey });
  });
};

/**
 * Smart refetch - only refetch if data is stale
 */
export const smartRefetch = async (
  queryClient: QueryClient,
  queryKey: string[],
  force = false
) => {
  const query = queryClient.getQueryState(queryKey);
  
  if (!force && query?.dataUpdatedAt) {
    const staleTime = query.meta?.staleTime as number || 30000;
    const isStale = Date.now() - query.dataUpdatedAt > staleTime;
    
    if (!isStale) {
      // Data is still fresh, no need to refetch
      return query.data;
    }
  }
  
  // Refetch if stale or forced
  await queryClient.refetchQueries({ queryKey });
  return queryClient.getQueryData(queryKey);
};

