import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useWishlistBatch(productIds: string[], enabled: boolean = true) {
  return useQuery({
    queryKey: ['wishlist-batch', productIds.sort()],
    queryFn: async () => {
      if (!productIds.length) return {};
      
      const response = await apiRequest('POST', '/api/wishlist/check-batch', { productIds });
      
      return response;
    },
    enabled: enabled && productIds.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });
}