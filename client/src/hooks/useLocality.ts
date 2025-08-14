import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

interface LocalityData {
  isLocal: boolean;
  zoneName?: string;
  freeDelivery: boolean;
  etaHours: [number, number];
}

interface LocalityResponse extends LocalityData {
  // API response format
}

export function useLocality() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, error } = useQuery<LocalityResponse>({
    queryKey: ['/api/locality/status', refreshKey],
    queryFn: async () => {
      const response = await fetch('/api/locality/status');
      if (!response.ok) {
        throw new Error('Failed to fetch locality status');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const refresh = useCallback(async (zip?: string) => {
    if (zip) {
      try {
        const response = await fetch(`/api/locality/status?zip=${encodeURIComponent(zip)}`);
        if (response.ok) {
          setRefreshKey(prev => prev + 1);
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to refresh locality with ZIP:', error);
      }
    } else {
      setRefreshKey(prev => prev + 1);
    }
  }, []);

  return {
    isLocal: data?.isLocal ?? false,
    zoneName: data?.zoneName,
    freeDelivery: data?.freeDelivery ?? false,
    eta: data?.etaHours ?? [24, 48] as [number, number],
    isLoading,
    error,
    refresh,
  };
}

export default useLocality;