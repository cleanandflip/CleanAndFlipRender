/**
 * useLocalStatus Hook - Local Delivery Detection
 * Determines if user is in local delivery area based on comprehensive fix plan
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UserWithLocationData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  defaultAddress?: {
    id: string;
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };
  isLocal: boolean;
  localRadiusMiles: number;
}

export function useLocalStatus() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', 'location-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user');
      return response.json() as Promise<UserWithLocationData>;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    isLocal: data?.isLocal ?? false,
    radius: data?.localRadiusMiles ?? 50,
    defaultAddress: data?.defaultAddress,
    isLoading,
    error
  };
}

export default useLocalStatus;