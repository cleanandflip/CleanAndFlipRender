import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocality } from "@/hooks/useLocality";
import { getCart, addToCartApi, setQtyByProduct, removeByProduct } from "@/lib/cartApi";

// V2 Cart Hook - unified qty field, single endpoint pattern
export function useCart() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: locality } = useLocality();

  // Create query key that includes user and locality state for proper invalidation
  const queryKey = ["cart", user?.id ?? "guest", locality?.localityVersion ?? "0"] as const;

  // Main cart query using V2 API
  const cartQuery = useQuery({
    queryKey,
    queryFn: getCart,
    staleTime: 0, // Always refetch to ensure fresh cart state
  });

  // Add to cart mutation (V2 - uses qty field)
  const addToCartMutation = useMutation({
    mutationFn: addToCartApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  // Update cart item quantity (V2 - absolute qty setter)
  const updateCartItemMutation = useMutation({
    mutationFn: async ({ productId, qty }: { productId: string; qty: number }) => setQtyByProduct(productId, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  // Remove product from cart (V2 - by productId)
  const removeByProductMutation = useMutation({
    mutationFn: removeByProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  // Helper functions
  const isInCart = (productId: string) => {
    return cartQuery.data?.items?.some((item: any) => item.productId === productId) || false;
  };

  const getItemQuantity = (productId: string) => {
    const item = cartQuery.data?.items?.find((item: any) => item.productId === productId);
    return item?.qty || 0; // V2 uses qty field
  };

  const getTotalItems = () => {
    return cartQuery.data?.items?.reduce((total: number, item: any) => total + item.qty, 0) || 0;
  };

  const getCartTotal = () => {
    return cartQuery.data?.totals?.total || 0;
  };

  return {
    // Data (V2 format)
    data: cartQuery.data,
    items: cartQuery.data?.items || [],
    totals: cartQuery.data?.totals || { subtotal: 0, total: 0 },
    ownerId: cartQuery.data?.ownerId,
    
    // State
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    error: cartQuery.error,
    
    // V2 Mutations - simplified API
    addToCart: (p: {productId: string; qty: number; variantId?: string | null}) => addToCartMutation.mutateAsync(p),
    updateCartItem: (p: {productId: string; qty: number}) => updateCartItemMutation.mutateAsync(p),
    removeByProduct: (productId: string) => removeByProductMutation.mutateAsync(productId),
    
    // Mutation states
    isAddingToCart: addToCartMutation.isPending,
    isUpdating: updateCartItemMutation.isPending,
    isRemovingByProduct: removeByProductMutation.isPending,
    
    // Helper functions (V2 compatible)
    isInCart,
    getItemQuantity,
    getTotalItems,
    getCartTotal,
    
    // Meta
    queryKey,
    refetch: cartQuery.refetch,
  };
}