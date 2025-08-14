import { useQuery } from '@tanstack/react-query';
import { DEFAULT_LOCALITY, LocalityStatus } from '../../../shared/locality';

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

export function useLocality(zipOverride?: string) {
  const q = useQuery({
    queryKey: ['locality', zipOverride ?? null],
    queryFn: () => fetchLocality(zipOverride),
    placeholderData: DEFAULT_LOCALITY, // shows immediately
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // ALWAYS return a concrete object
  return {
    ...q,
    data: (q.data ?? DEFAULT_LOCALITY) as LocalityStatus,
  };
}