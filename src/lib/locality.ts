// src/lib/locality.ts
import { useQuery } from '@tanstack/react-query';

interface LocalityStatus {
  isLocal: boolean;
  zip: string | null;
  serviceRadiusMiles: number;
}

export function useLocality() {
  return useQuery({
    queryKey: ['locality', 'status'],
    queryFn: async () => {
      const response = await fetch('/api/locality/status', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch locality status');
      return response.json() as Promise<LocalityStatus>;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false,
  });
}