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
      
      // Handle LOCAL_ONLY_NOT_ELIGIBLE specially (server returns 403 with structured error)
      // CRITICAL FIX: Don't rollback on 403 - this was causing the bogus 404 deletes
      if (error.status === 403 && error.body?.code === 'LOCAL_ONLY_NOT_ELIGIBLE') {
        toast({
          title: "Not available in your area",
          description: "This item is local delivery only. Set a local default address to order.",
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

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    error: cartQuery.error,
    addToCart: addToCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending
  };
}