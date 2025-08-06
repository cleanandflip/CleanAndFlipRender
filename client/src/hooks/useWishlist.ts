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
  const { data: wishlist = [], isLoading, refetch } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch('/api/wishlist', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch wishlist');
      const data = await response.json();
      // API returns array directly, not wrapped in wishlist property
      return Array.isArray(data) ? data : [];
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
  
  // Toggle wishlist without optimistic updates to prevent instability
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
    onSuccess: () => {
      // Force immediate refetch instead of just invalidating
      queryClient.refetchQueries({ queryKey: ['wishlist'] });
      // Cross-tab update signal
      localStorage.setItem('wishlist-update', Date.now().toString());
      // Broadcast global event
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    },
    onError: (error) => {
      console.error('Wishlist toggle error:', error);
    },
    retry: 0, // Don't retry to prevent double mutations
  });
  
  // Helper function to check if product is wishlisted
  const isWishlisted = (productId: string) => {
    return wishlist.some((item: any) => item.productId === productId);
  };
  
  return {
    wishlist,
    isLoading,
    toggleWishlist,
    isWishlisted,
    wishlistCount: wishlist.length,
  };
}