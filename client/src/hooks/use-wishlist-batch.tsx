import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Custom hook for batch wishlist operations - optimizes performance
export function useWishlistBatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Batch check wishlist status for multiple products
  const batchCheckWishlist = async (productIds: string[]): Promise<Record<string, boolean>> => {
    if (productIds.length === 0) return {};

    const response = await fetch('/api/wishlist/check-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ productIds }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User not logged in - return empty wishlist map
        return {};
      }
      throw new Error('Failed to check wishlist');
    }

    return response.json();
  };

  // Query for batch wishlist check
  const useBatchWishlistCheck = (productIds: string[], enabled: boolean = true) => {
    return useQuery({
      queryKey: ['wishlist-batch', productIds.sort()], // Sort for consistent cache key
      queryFn: () => batchCheckWishlist(productIds),
      enabled: enabled && productIds.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry 401 errors (user not logged in)
        if (error?.response?.status === 401) return false;
        return failureCount < 2;
      },
    });
  };

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to wishlist');
      }

      return response.json();
    },
    onSuccess: (_, productId) => {
      // Invalidate all wishlist queries
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-batch'] });
      
      // Update specific batch queries that contain this product
      queryClient.setQueriesData(
        { queryKey: ['wishlist-batch'] },
        (oldData: Record<string, boolean> | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, [productId]: true };
        }
      );

      toast({
        title: "Added to wishlist",
        description: "Item saved to your wishlist",
      });

      // Dispatch global event for cross-component updates
      window.dispatchEvent(new CustomEvent('wishlistUpdated', {
        detail: { action: 'added', productId }
      }));
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add to wishlist",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove from wishlist');
      }

      return response.json();
    },
    onSuccess: (_, productId) => {
      // Invalidate all wishlist queries
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-batch'] });
      
      // Update specific batch queries that contain this product
      queryClient.setQueriesData(
        { queryKey: ['wishlist-batch'] },
        (oldData: Record<string, boolean> | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, [productId]: false };
        }
      );

      toast({
        title: "Removed from wishlist",
        description: "Item removed from your wishlist",
      });

      // Dispatch global event for cross-component updates
      window.dispatchEvent(new CustomEvent('wishlistUpdated', {
        detail: { action: 'removed', productId }
      }));
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove from wishlist",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  return {
    useBatchWishlistCheck,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    isAddingToWishlist: addToWishlistMutation.isPending,
    isRemovingFromWishlist: removeFromWishlistMutation.isPending,
  };
}