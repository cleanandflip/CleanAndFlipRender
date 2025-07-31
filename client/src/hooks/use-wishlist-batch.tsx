import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

// Batch wishlist checking to reduce API spam
export function useWishlistBatch(productIds: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['wishlist-batch', productIds.sort()], // Sort for consistent caching
    queryFn: async () => {
      if (!user || !productIds.length) return {};
      
      const response = await fetch('/api/wishlist/check-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ productIds })
      });
      
      if (!response.ok) throw new Error('Failed to check wishlist batch');
      return response.json();
    },
    enabled: !!user && productIds.length > 0,
    staleTime: 30000, // 30 seconds - aggressive caching
    cacheTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Only fetch once per mount
  });
}

// Individual wishlist hook that uses batch data when available
export function useWishlistStatus(productId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['wishlist', productId],
    queryFn: async () => {
      const response = await fetch('/api/wishlist/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ productId })
      });
      
      if (!response.ok) throw new Error('Failed to check wishlist');
      return response.json();
    },
    enabled: !!user && !!productId,
    staleTime: 30000, // 30 seconds
    cacheTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}