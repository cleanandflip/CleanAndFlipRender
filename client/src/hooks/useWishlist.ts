import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { useEffect } from 'react';

interface WishlistItem {
  productId: string;
  addedAt: string;
}

export function useWishlist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Fetch wishlist with real-time sync
  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch('/api/wishlist', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch wishlist');
      const data = await response.json();
      return data.wishlist || [];
    },
    enabled: !!user,
    staleTime: 0, // Always check for updates
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Listen for cross-tab wishlist changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wishlist-update') {
        queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient]);
  
  // Toggle wishlist with optimistic updates
  const toggleWishlist = useMutation({
    mutationFn: async (productId: string) => {
      const isCurrentlyWishlisted = wishlist.some((item: WishlistItem) => item.productId === productId);
      
      if (isCurrentlyWishlisted) {
        const response = await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId })
        });
        if (!response.ok) throw new Error('Failed to remove from wishlist');
        return { action: 'removed', productId };
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId })
        });
        if (!response.ok) throw new Error('Failed to add to wishlist');
        return { action: 'added', productId };
      }
    },
    onMutate: async (productId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      
      // Snapshot the previous value
      const previousWishlist = queryClient.getQueryData(['wishlist']);
      
      // Optimistically update
      queryClient.setQueryData(['wishlist'], (old: WishlistItem[] = []) => {
        const exists = old.some(item => item.productId === productId);
        if (exists) {
          return old.filter(item => item.productId !== productId);
        } else {
          return [...old, { productId, addedAt: new Date().toISOString() }];
        }
      });
      
      // Return context with snapshot
      return { previousWishlist };
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist);
      }
    },
    onSuccess: () => {
      // Broadcast to other tabs
      window.localStorage.setItem('wishlist-update', Date.now().toString());
      
      // Broadcast global event
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      
      // Always refetch after success
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
  
  // Helper function to check if product is wishlisted
  const isWishlisted = (productId: string) => {
    return wishlist.some((item: WishlistItem) => item.productId === productId);
  };
  
  return {
    wishlist,
    isLoading,
    toggleWishlist,
    isWishlisted,
    wishlistCount: wishlist.length,
  };
}