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
  const ownerId = 'session'; // Cart works with session IDs for both guests and authenticated users
  
  // Use scoped query keys for cache invalidation on locality changes
  const cartQuery = useQuery({
    queryKey: cartKeys.scoped(ownerId, localityVersion.toString()),
    queryFn: () => apiJson("/* SSOT-FORBIDDEN /api/cart(?!\.v2) */ /api/cart"),
    staleTime: 30_000 // 30 seconds
  });

  // Add to cart mutation with SSOT V2 endpoints
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      apiJson("/* SSOT-FORBIDDEN /api/cart(?!\.v2) */ /api/cart/items", {
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
        if (!old?.items) return old;
        const existingItem = old.items.find((item: any) => item.productId === productId);
        if (existingItem) {
          return {
            ...old,
            items: old.items.map((item: any) =>
              item.productId === productId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          };
        } else {
          // Add new item (simplified - real product data will come from server)
          return {
            ...old,
            items: [...old.items, { productId, quantity, product: { id: productId } }]
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
      
      toast({
        title: "Error adding to cart",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      
      // Show custom success message based on response
      if (data?.stock_status === 'ADDED_PARTIAL_STOCK_CAP') {
        toast({
          title: "Added to cart",
          description: `Added ${data.qty || 1} items (max stock reached)`
        });
      } else {
        toast({
          title: "Added to cart",
          description: "Item successfully added to your cart"
        });
      }
    }
  });

  // Remove item by ID mutation for legacy compatibility
  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => 
      apiJson(`/* SSOT-FORBIDDEN /api/cart(?!\.v2) */ /api/cart/items/${itemId}`, { method: "DELETE" }),
    onMutate: async (itemId) => {
      const cartQueryKey = cartKeys.scoped(ownerId, localityVersion.toString());
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousCart = queryClient.getQueryData(cartQueryKey);
      
      // Optimistically remove item
      queryClient.setQueryData(cartQueryKey, (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.filter((item: any) => item.id !== itemId)
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
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    }
  });

  // Remove by productId (compound key) for all users
  const removeByProductMutation = useMutation({
    mutationFn: (productId: string) => 
      apiJson(`/* SSOT-FORBIDDEN /api/cart(?!\.v2) */ /api/cart/product/${productId}`, { method: "DELETE" }),
    onMutate: async (productId) => {
      const cartQueryKey = cartKeys.scoped(ownerId, localityVersion.toString());
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousCart = queryClient.getQueryData(cartQueryKey);
      
      // Optimistically remove by productId
      queryClient.setQueryData(cartQueryKey, (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.filter((item: any) => item.productId !== productId)
        };
      });
      
      return { previousCart };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      
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
      apiJson(`/* SSOT-FORBIDDEN /api/cart(?!\.v2) */ /api/cart/items`, {
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
    cart: cartQuery,
    addToCart: addToCartMutation.mutate,
    removeItem: removeItemMutation.mutate,
    removeByProduct: removeByProductMutation.mutate,
    updateItem: updateCartItemMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isRemovingItem: removeItemMutation.isPending,
    isRemovingByProduct: removeByProductMutation.isPending,
    isUpdatingItem: updateCartItemMutation.isPending,
  };
}