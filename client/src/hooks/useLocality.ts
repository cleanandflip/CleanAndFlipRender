import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { LocalityResult, LocalityStatusLegacy, DEFAULT_LOCALITY, SSOT_VERSION } from '../../../shared/locality';
import { apiJson } from '../lib/api';

// SSOT useLocality hook - fetches from /api/locality/status
export function useLocality(zipOverride?: string) {
  const [localityVersion, setLocalityVersion] = useState(0);
  const queryClient = useQueryClient();
  
  // Scoped query key includes locality version for cache invalidation
  const queryKey = ['locality', 'status', zipOverride ?? null, localityVersion];
  
  const query = useQuery<LocalityResult>({
    queryKey,
    queryFn: async () => {
      const url = zipOverride 
        ? `/api/locality/status?zip=${encodeURIComponent(zipOverride)}`
        : '/api/locality/status';
      
      const result = await apiJson(url) as LocalityResult;
      
      // Validate the response has required SSOT fields
      if (!result.ssotVersion || !result.asOfISO) {
        console.warn('[LOCALITY] Response missing SSOT fields, falling back');
        throw new Error('Invalid locality response structure');
      }
      
      return result;
    },
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Function to trigger locality change (ZIP/address updates)
  const onLocalityChange = useCallback(() => {
    setLocalityVersion(v => v + 1);
    // Invalidate all locality-related queries
    queryClient.invalidateQueries({ queryKey: ['locality'] });
    queryClient.invalidateQueries({ queryKey: ['cart'] }); // Cart depends on locality
    queryClient.invalidateQueries({ queryKey: ['products'] }); // Product lists too
  }, [queryClient]);
  
  // Safe fallback for error states
  const safeData: LocalityResult = query.data ?? {
    status: 'UNKNOWN',
    source: 'default',
    eligible: false,
    effectiveModeForUser: 'NONE',
    reasons: ['Loading locality data...'],
    ssotVersion: SSOT_VERSION,
    asOfISO: new Date().toISOString()
  };
  
  return {
    data: safeData,
    ssotVersion: safeData.ssotVersion,
    localityVersion,
    onLocalityChange,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}

// Legacy compatibility hook
export function useLocalityLegacy(zipOverride?: string) {
  const query = useQuery<LocalityStatusLegacy>({
    queryKey: ['locality', 'legacy', zipOverride ?? null],
    queryFn: async () => {
      const url = zipOverride 
        ? `/api/locality/status?zip=${encodeURIComponent(zipOverride)}`
        : '/api/locality/status';
      
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Locality request failed: ${res.status}`);
      
      const newData = (await res.json()) as LocalityResult;
      
      // Convert new format to legacy format
      return {
        eligible: newData.eligible,
        source: newData.source === 'address' ? 'DEFAULT_ADDRESS' as const :
                newData.source === 'zip' ? 'ZIP_OVERRIDE' as const :
                newData.source === 'ip' ? 'IP' as const : 'NONE' as const,
        reason: newData.eligible ? 'IN_LOCAL_AREA' as const : 'FALLBACK_NON_LOCAL' as const,
        zipUsed: newData.zip ?? null,
        city: null,
        state: null,
        zip: newData.zip ?? 'none',
        user: null,
      };
    },
    placeholderData: DEFAULT_LOCALITY,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    ...query,
    data: (query.data ?? DEFAULT_LOCALITY) as LocalityStatusLegacy,
  };
}

// Keep existing export for backward compatibility
export { DEFAULT_LOCALITY };