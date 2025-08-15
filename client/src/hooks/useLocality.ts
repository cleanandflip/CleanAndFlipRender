import { useQuery } from '@tanstack/react-query';
import { DEFAULT_LOCALITY, LocalityStatus } from '../../../shared/locality';
import { apiJson } from '../lib/api';

// ADDITIVE: Export safe default constant
export const DEFAULT_LOCALITY_SAFE = { 
  eligible: false, 
  zip: 'none', 
  source: 'NONE', 
  loading: true 
} as const;

// Keep existing export for compatibility
export { DEFAULT_LOCALITY };

function buildLocalityUrl(zip?: string) {
  const base = '/api/locality/status';
  return zip ? `${base}?zip=${encodeURIComponent(zip)}` : base; // no stray '?'
}

async function fetchLocality(zip?: string): Promise<LocalityStatus> {
  const res = await fetch(buildLocalityUrl(zip), { credentials: 'include' });
  if (!res.ok) throw new Error(`Locality request failed: ${res.status}`);
  const data = (await res.json()) as LocalityStatus;
  // harden the shape to avoid undefined in the UI
  return {
    eligible: !!data.eligible,
    source: data.source ?? 'NONE',
    reason: data.reason ?? 'FALLBACK_NON_LOCAL',
    zipUsed: data.zipUsed ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    zip: data.zip ?? data.zipUsed ?? 'none',
    user: data.user ?? null,
  };
}

// ADDITIVE: Single source of truth locality hook
export function useLocality(zipOverride?: string) {
  const q = useQuery({
    queryKey: ['locality', 'status', zipOverride ?? null], // unified key
    queryFn: () => apiJson('/api/locality/status'), // use authenticated wrapper
    placeholderData: DEFAULT_LOCALITY, // shows immediately
    staleTime: 30_000, // 30 seconds
    gcTime: 30 * 60 * 1000,
  });

  // ALWAYS return a safe object
  const body = q.data ?? DEFAULT_LOCALITY;
  return { 
    ...body, 
    loading: q.isLoading || q.isFetching 
  };
}

// ADDITIVE: Keep existing function for compatibility
export function useLocalityLegacy(zipOverride?: string) {
  const q = useQuery({
    queryKey: ['locality', zipOverride ?? null],
    queryFn: () => fetchLocality(zipOverride),
    placeholderData: DEFAULT_LOCALITY,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    ...q,
    data: (q.data ?? DEFAULT_LOCALITY) as LocalityStatus,
  };
}