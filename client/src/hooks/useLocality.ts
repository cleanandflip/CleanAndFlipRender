// Unified Locality Hook - Single Source of Truth
import { useQuery } from '@tanstack/react-query';

export type LocalityStatus = {
  eligible: boolean;
  source: 'DEFAULT_ADDRESS' | 'ZIP_OVERRIDE' | 'IP' | 'NONE';
  reason: 'IN_LOCAL_AREA' | 'NO_DEFAULT_ADDRESS' | 'ZIP_NOT_LOCAL' | 'FALLBACK_NON_LOCAL';
  zipUsed?: string | null;
  city?: string | null;
  state?: string | null;
};

export function useLocality(zipOverride?: string | null) {
  const query = useQuery<LocalityStatus>({
    queryKey: ['locality', { zipOverride: zipOverride ?? null }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (zipOverride) params.set('zip', zipOverride);
      const res = await fetch(`/api/locality/status?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch locality');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (process.env.NODE_ENV === 'development' && query.data) {
    console.log(`[LOCALITY] Client: eligible=${query.data.eligible} source=${query.data.source} zip=${query.data.zipUsed || 'none'}`);
  }

  return {
    status: query.data,
    eligible: query.data?.eligible ?? false,
    loading: query.isLoading,
    error: query.error as Error | null
  };
}