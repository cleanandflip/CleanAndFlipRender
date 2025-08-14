// Unified Locality Hook - Single Source of Truth
import { useQuery } from '@tanstack/react-query';
import type { LocalityStatus } from '@shared/locality';

export interface UseLocalityResult extends LocalityStatus {
  isLoading: boolean;
  error: Error | null;
  refresh: (zip?: string) => Promise<void>;
}

export function useLocality(zipOverride?: string): UseLocalityResult {
  const queryKey = ['locality', zipOverride].filter(Boolean);
  
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const url = zipOverride 
        ? `/api/locality/status?zip=${encodeURIComponent(zipOverride)}`
        : '/api/locality/status';
      
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Locality check failed: ${response.status}`);
      }
      return response.json() as Promise<LocalityStatus>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false
  });

  const refresh = async (zip?: string) => {
    const newQueryKey = ['locality', zip].filter(Boolean);
    await query.refetch();
  };

  if (process.env.NODE_ENV === 'development') {
    const data = query.data;
    if (data) {
      console.log(`[LOCALITY] eligible=${data.eligible} zone=${data.zone} source=${data.source} zip=${data.zip || 'none'}`);
    }
  }

  return {
    eligible: query.data?.eligible || false,
    zone: query.data?.zone || 'NON_LOCAL',
    zip: query.data?.zip,
    reason: query.data?.reason,
    source: query.data?.source || 'IP',
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refresh
  };
}