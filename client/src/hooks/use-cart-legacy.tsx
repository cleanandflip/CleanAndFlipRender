import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// SSOT Cart interfaces matching server structure
export interface CartProduct {
  id: string;
  name: string;
  price: string;
  images: string[];
  brand?: string;
  stockQuantity: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  shippingAddressId: string | null;
}

export const CART_KEY = ['cart'] as const;

// Main cart hook - uses new SSOT API structure
export function useCart() {
  return useQuery({
    queryKey: CART_KEY,
    staleTime: 30000, // 30 seconds cache
    refetchOnWindowFocus: false,
  });
}

// Add to cart mutation using new API structure  
export function useAddToCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (vars: { productId: string; quantity?: number }) => {
      return await apiRequest('POST', '/api/cart/items', {
        productId: vars.productId,
        quantity: vars.quantity || 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive"
      });
    },
  });
}

// Update cart item quantity
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (vars: { productId: string; quantity: number }) => {
      return await apiRequest('PUT', `/api/cart/items/${vars.productId}`, {
        quantity: vars.quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update cart",
        variant: "destructive"
      });
    },
  });
}

// Remove from cart mutation
export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest('DELETE', `/api/cart/items/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to remove item",
        variant: "destructive"
      });
    },
  });
}
                variantId: vars.variantId ?? null,
              }
            ],
          };
          qc.setQueryData(CART_KEY, next);
        }
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(CART_KEY, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CART_KEY });
    },
  });
}

// Update cart item quantity
export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cart:update'] as const,
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await apiRequest('PATCH', `/api/cart/${itemId}`, { quantity });
      const result = await response.json();
      return result.ok ? result.data : result;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CART_KEY });
    },
  });
}

// Remove item from cart with optimistic update
export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cart:remove'] as const,
    mutationFn: async (productId: string) => {
      const response = await apiRequest('DELETE', `/api/cart/items/${productId}`);
      const result = await response.json();
      return result.ok ? result.data : result;
    },
    onMutate: async (productId) => {
      await qc.cancelQueries({ queryKey: CART_KEY });
      const prev = qc.getQueryData<Cart>(CART_KEY);
      if (prev) {
        const next: Cart = {
          ...prev,
          items: prev.items.filter(item => item.productId !== productId),
        };
        qc.setQueryData(CART_KEY, next);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(CART_KEY, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CART_KEY });
    },
  });
}

// Get cart items count for badge display
export function useCartCount() {
  const { data: cart } = useCart();
  return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

// Legacy compatibility hooks for components that haven't been updated yet
export function useCartLegacy() {
  const { data, isLoading, isError } = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveFromCart();
  
  const items = data?.items ?? [];
  const cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return {
    cartItems: items,
    updateQuantity: (itemId: string, quantity: number) => updateMutation.mutate({ itemId, quantity }),
    removeFromCart: (itemId: string) => removeMutation.mutate(itemId),
    cartTotal,
    cartCount,
    isLoading,
    isError
  };
}