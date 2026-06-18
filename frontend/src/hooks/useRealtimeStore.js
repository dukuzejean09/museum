import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';

/**
 * Hook that listens for real-time socket events and updates React Query cache.
 * This is the bridge between WebSocket events and the client-side data store.
 *
 * Usage:
 *   useRealtimeSync('exhibition', ['exhibitions', 'featured-exhibitions']);
 *
 * When a 'exhibition:created', 'exhibition:updated', or 'exhibition:deleted' event
 * arrives via WebSocket, the specified query keys are automatically invalidated,
 * causing components using those queries to re-fetch fresh data.
 */
export function useRealtimeSync(entityType, queryKeys = []) {
  const { on } = useSocket() || {};
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!on) return;

    const unsubs = [];

    // Invalidate queries when entity changes
    const invalidate = () => {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      });
    };

    unsubs.push(on(`${entityType}:created`, invalidate));
    unsubs.push(on(`${entityType}:updated`, invalidate));
    unsubs.push(on(`${entityType}:deleted`, invalidate));

    return () => unsubs.forEach(fn => fn());
  }, [on, entityType, queryClient, ...queryKeys]);
}

/**
 * Hook for real-time entity detail updates.
 * Joins the entity room and listens for updates to a specific entity.
 *
 * Usage:
 *   useRealtimeEntity('exhibition', exhibitionId, ['exhibition', exhibitionId]);
 */
export function useRealtimeEntity(entityType, entityId, queryKey) {
  const { on, joinEntity } = useSocket() || {};
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!on || !joinEntity || !entityId) return;

    const leaveRoom = joinEntity(entityType, entityId);

    const unsubs = [];

    unsubs.push(on(`${entityType}:updated`, (payload) => {
      const data = payload?.data;
      if (data && (data._id === entityId || data.id === entityId)) {
        queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
      }
    }));

    unsubs.push(on(`${entityType}:deleted`, (payload) => {
      if (payload?.id === entityId) {
        queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
      }
    }));

    return () => {
      leaveRoom();
      unsubs.forEach(fn => fn());
    };
  }, [on, joinEntity, entityType, entityId, queryClient]);
}

/**
 * Hook to listen for real-time notifications
 */
export function useRealtimeNotifications(callback) {
  const { on } = useSocket() || {};
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!on) return;
    return on('notification', (data) => callbackRef.current?.(data));
  }, [on]);
}

/**
 * Hook for admin dashboard - syncs all admin-relevant data
 */
export function useAdminRealtimeSync() {
  const { on } = useSocket() || {};
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!on) return;

    const unsubs = [];

    // Dashboard stats should refresh on any content change
    const refreshDashboard = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    };

    const entities = [
      'exhibition', 'artifact', 'story', 'trail', 'guide',
      'booking', 'message', 'survey', 'evaluation', 'user', 'accessCode'
    ];

    entities.forEach(entity => {
      unsubs.push(on(`${entity}:created`, refreshDashboard));
      unsubs.push(on(`${entity}:updated`, refreshDashboard));
      unsubs.push(on(`${entity}:deleted`, refreshDashboard));
    });

    // Analytics events
    unsubs.push(on('analytics:event', refreshDashboard));

    return () => unsubs.forEach(fn => fn());
  }, [on, queryClient]);
}

/**
 * Background preloader - fetches commonly used data on app start.
 * Called once when the app mounts.
 */
export function useBackgroundPreloader(api) {
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || !api) return;
    hasRun.current = true;

    // Preload public data in background with low priority
    const preload = async () => {
      const prefetchOptions = { staleTime: 5 * 60 * 1000 };

      // Fire all prefetches in parallel - don't await, let them run in background
      queryClient.prefetchQuery({
        queryKey: ['featured-exhibitions'],
        queryFn: () => api.fetchFeaturedExhibitions().then(r => r.data),
        ...prefetchOptions,
      });

      queryClient.prefetchQuery({
        queryKey: ['featured-trails'],
        queryFn: () => api.fetchFeaturedTrails().then(r => r.data),
        ...prefetchOptions,
      });

      queryClient.prefetchQuery({
        queryKey: ['exhibitions', { page: 1, limit: 12 }],
        queryFn: () => api.fetchExhibitions({ page: 1, limit: 12, status: 'published' }).then(r => r.data),
        ...prefetchOptions,
      });

      queryClient.prefetchQuery({
        queryKey: ['artifacts', { page: 1, limit: 12 }],
        queryFn: () => api.fetchArtifacts({ page: 1, limit: 12, status: 'published' }).then(r => r.data),
        ...prefetchOptions,
      });

      queryClient.prefetchQuery({
        queryKey: ['trails', { limit: 20 }],
        queryFn: () => api.fetchTrails({ limit: 20 }).then(r => r.data),
        ...prefetchOptions,
      });

      queryClient.prefetchQuery({
        queryKey: ['guides'],
        queryFn: () => api.fetchGuides().then(r => {
          const d = r.data;
          return Array.isArray(d) ? d : d?.data || [];
        }),
        ...prefetchOptions,
      });

      queryClient.prefetchQuery({
        queryKey: ['stories', { page: 1, limit: 9 }],
        queryFn: () => api.fetchStories({ page: 1, limit: 9, status: 'published' }).then(r => r.data),
        ...prefetchOptions,
      });
    };

    // Delay preloading slightly to not block initial render
    setTimeout(preload, 1000);
  }, [queryClient, api]);
}
