import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocality } from "./useLocality";
import { cartKeys } from "@/lib/cartKeys";

export function useCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // SSOT locality-aware cart query
  const { data: locality, localityVersion } = useLocality();
  const ownerId = 'current-user'; // Simplified for now - could be enhanced with auth context
  
  // Use scoped query keys for cache invalidation on locality changes
  const cartQuery = useQuery({
    queryKey: cartKeys.scoped(ownerId, localityVersion.toString()),
    queryFn: () => apiJson("/api/cart"),
    staleTime: 30_000 // 30 seconds
  });

  // Add to cart mutation with SSOT V2 endpoints
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      apiJson("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity })
      }),
    onMutate: async ({ productId, quantity }) => {
      // Optimistic update for instant UI feedback using scoped keys
      const cartQueryKey = cartKeys.scoped(ownerId, localityVersion.toString());
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousCart = queryClient.getQueryData(cartQueryKey);
      
      // Optimistically add item to cache
      queryClient.setQueryData(cartQueryKey, (old: any) => {
        if (!old?.data?.items) return old;
        const existingItem = old.data.items.find((item: any) => item.productId === productId);
        if (existingItem) {
          return {
            ...old,
            data: {
              ...old.data,
              items: old.data.items.map((item: any) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            }
          };
        } else {
          // Add new item (simplified - real product data will come from server)
          return {
            ...old,
            data: {
              ...old.data,
              items: [...old.data.items, { productId, quantity, product: { id: productId } }]
            }
          };
        }
      });
      
      return { previousCart };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error using scoped key
      const cartQueryKey = cartKeys.scoped(ownerId, localityVersion.toString());
      queryClient.setQueryData(cartQueryKey, context?.previousCart);
      
      // Handle SSOT INELIGIBLE specially (new V2 error format)
      if (error.status === 422 && error.body?.error === 'INELIGIBLE') {
        const reasons = error.body?.reasons || ['Item not available in your area'];
        toast({
          title: "Not available in your area", 
          description: reasons[0] || 'This item cannot be added to your cart.',
          variant: "destructive"
        });
        return;
      }

      // Handle stock validation errors
      if (error.status === 422 && error.body?.error === 'INSUFFICIENT_STOCK') {
        toast({
          title: "Not enough stock",
          description: error.body?.message || 'Item has limited availability.',
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive"
      });
    },
    onSettled: () => {
      // Refetch to get accurate server state using scoped keys
      queryClient.invalidateQueries({ queryKey: cartKeys.root });
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: "Item successfully added to your cart",
      });
    }
  });

  // Remove from cart mutation with authentication
  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: string) =>
      apiJson(`/api/cart/items/${itemId}`, {
        method: "DELETE"
      }),
    onMutate: async (itemId) => {
      const cartQueryKey = cartKeys.scoped(ownerId, localityVersion.toString());
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousCart = queryClient.getQueryData(cartQueryKey);
      
      // Optimistically remove item
      queryClient.setQueryData(cartQueryKey, (old: any) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.filter((item: any) => item.id !== itemId)
          }
        };
      });
      
      return { previousCart };
    },
    onError: (error, variables, context) => {
      const cartQueryKey = cartKeys.scoped(ownerId, localityVersion.toString());
      queryClient.setQueryData(cartQueryKey, context?.previousCart);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive"
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.root });
    }
  });

  // ADDITIVE: Remove by productId (compound key) for authenticated users
  const removeByProductMutation = useMutation({
    mutationFn: (productId: string) => 
      apiJson(`/api/cart/product/${productId}`, { method: "DELETE" }),
    onMutate: async (productId) => {
      const cartQueryKey = cartKeys.scoped(ownerId, localityVersion.toString());
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousCart = queryClient.getQueryData(cartQueryKey);
      
      // Optimistically remove by productId
      queryClient.setQueryData(cartQueryKey, (old: any) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.filter((item: any) => item.productId !== productId)
          }
        };
      });
      
      return { previousCart };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.root });
      
      // Show purge notification if items were auto-removed
      if (data?.purgedLocalOnly && data?.removed > 0) {
        toast({
          title: "Items auto-removed",
          description: `${data.removed} local-only item(s) were removed because your address is outside our local delivery area.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart"
        });
      }
    },
    onError: (error: any, productId, context) => {
      const cartQueryKey = cartKeys.scoped(ownerId, localityVersion.toString());
      queryClient.setQueryData(cartQueryKey, context?.previousCart);
      
      // Handle AUTH_REQUIRED specially
      if (error.status === 401) {
        toast({
          title: "Sign in required",
          description: "Please sign in to manage your cart",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to remove item",
        variant: "destructive"
      });
    }
  });

  // Update cart item mutation
  const updateCartItemMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      apiJson(`/api/cart/items`, {
        method: "PATCH",
        body: JSON.stringify({ productId, quantity })
      }),
    onSuccess: () => {
      const cartQueryKey = cartKeys.scoped(ownerId, localityVersion.toString());
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update cart", description: error.message || "Please try again", variant: "destructive" });
    }
  });

  return {
    data: cartQuery.data, // SSOT pattern
    cart: cartQuery, // Full query object for compatibility 
    isLoading: cartQuery.isLoading,
    error: cartQuery.error,
    addToCart: addToCartMutation.mutate,
    updateCartItem: updateCartItemMutation.mutate, // Added method
    removeFromCart: removeFromCartMutation.mutate,
    removeByProduct: removeByProductMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingCartItem: updateCartItemMutation.isPending, // Added loading state
    isRemovingFromCart: removeFromCartMutation.isPending,
    isRemovingByProduct: removeByProductMutation.isPending
  };
}