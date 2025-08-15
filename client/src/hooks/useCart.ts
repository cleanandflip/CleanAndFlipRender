import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api"; // CRITICAL: Use authenticated API wrapper
import { useToast } from "@/hooks/use-toast";

export function useCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Centralized cart query with authentication
  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiJson("/api/cart")
  });

  // Add to cart mutation with authenticated requests
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      apiJson("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity })
      }),
    onMutate: async ({ productId, quantity }) => {
      // Optimistic update for instant UI feedback
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData(["cart"]);
      
      // Optimistically add item to cache
      queryClient.setQueryData(["cart"], (old: any) => {
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
      // Rollback on error
      queryClient.setQueryData(["cart"], context?.previousCart);
      
      // Handle LOCALITY_BLOCKED specially (updated server error format)
      if (error.status === 403 && error.body?.code === 'LOCALITY_BLOCKED') {
        toast({
          title: "Not available in your area",
          description: "This item is local delivery only. Add a local address to continue.",
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
      // Refetch to get accurate server state
      queryClient.invalidateQueries({ queryKey: ["cart"] });
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
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData(["cart"]);
      
      // Optimistically remove item
      queryClient.setQueryData(["cart"], (old: any) => {
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
      queryClient.setQueryData(["cart"], context?.previousCart);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive"
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  });

  // ADDITIVE: Remove by productId (compound key) for authenticated users
  const removeByProductMutation = useMutation({
    mutationFn: (productId: string) => 
      apiJson(`/api/cart/product/${productId}`, { method: "DELETE" }),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData(["cart"]);
      
      // Optimistically remove by productId
      queryClient.setQueryData(["cart"], (old: any) => {
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
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      
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
      queryClient.setQueryData(["cart"], context?.previousCart);
      
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

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    error: cartQuery.error,
    addToCart: addToCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    removeByProduct: removeByProductMutation.mutate, // ADDITIVE: compound key removal
    isAddingToCart: addToCartMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
    isRemovingByProduct: removeByProductMutation.isPending
  };
}