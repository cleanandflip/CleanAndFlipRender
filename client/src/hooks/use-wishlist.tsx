import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  createdAt: string;
}

export function useWishlist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user's wishlist
  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ['/api/wishlist'],
    queryFn: async () => {
      const response = await fetch('/api/wishlist', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to fetch wishlist');
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 0, // Always fresh for real-time sync
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Toggle wishlist mutation with optimistic updates
  const toggleWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const isCurrentlyWishlisted = isInWishlist(productId);
      const method = isCurrentlyWishlisted ? 'DELETE' : 'POST';
      const url = isCurrentlyWishlisted ? `/api/wishlist/${productId}` : '/api/wishlist';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: method === 'POST' ? JSON.stringify({ productId }) : undefined,
      });
      
      if (!response.ok) throw new Error('Failed to update wishlist');
      return { productId, action: isCurrentlyWishlisted ? 'removed' : 'added' };
    },
    onMutate: async (productId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/wishlist'] });
      
      // Snapshot previous value
      const previousWishlist = queryClient.getQueryData(['/api/wishlist']) as WishlistItem[];
      
      // Optimistic update
      const isCurrentlyWishlisted = isInWishlist(productId);
      const newWishlist = isCurrentlyWishlisted
        ? previousWishlist.filter(item => item.productId !== productId)
        : [...previousWishlist, { 
            id: `temp-${Date.now()}`, 
            productId, 
            userId: user?.id || '', 
            createdAt: new Date().toISOString() 
          }];
      
      queryClient.setQueryData(['/api/wishlist'], newWishlist);
      
      // Broadcast global event for other components
      const action = isCurrentlyWishlisted ? 'removed' : 'added';
      window.dispatchEvent(
        new CustomEvent('wishlistUpdated', { 
          detail: { productId, action, timestamp: Date.now() } 
        })
      );
      
      return { previousWishlist };
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(['/api/wishlist'], context.previousWishlist);
      }
      
      toast({
        title: "Wishlist Update Failed",
        description: "Failed to update your wishlist. Please try again.",
        variant: "destructive"
      });
    },
    onSuccess: (data) => {
      // Show success feedback
      toast({
        title: data.action === 'added' ? "Added to Wishlist" : "Removed from Wishlist",
        description: data.action === 'added' 
          ? "Item saved to your wishlist" 
          : "Item removed from your wishlist",
      });
    },
    onSettled: () => {
      // Always refetch to ensure server sync
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
    },
  });
  
  // Helper function to check if product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some((item: WishlistItem) => item.productId === productId);
  };
  
  // Helper function to get wishlist item ID
  const getWishlistItemId = (productId: string): string | undefined => {
    return wishlistItems.find((item: WishlistItem) => item.productId === productId)?.id;
  };
  
  return {
    wishlistItems,
    isLoading,
    toggleWishlist: toggleWishlistMutation.mutate,
    isToggling: toggleWishlistMutation.isPending,
    isInWishlist,
    getWishlistItemId,
    wishlistCount: wishlistItems.length,
  };
}