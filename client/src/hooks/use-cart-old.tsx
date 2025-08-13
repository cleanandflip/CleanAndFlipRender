import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Cart interfaces matching the comprehensive fix plan
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string | null;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

export const CART_KEY = ['cart'] as const;

// Main cart hook with optimistic updates
export function useCart() {
  return useQuery({
    queryKey: CART_KEY,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/cart');
      const result = await response.json();
      return result.ok ? result.data : result; // Handle both new and legacy formats
    },
    staleTime: 60000, // 1 minute cache as per fix plan
  });
}

// Optimistic add to cart mutation
export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cart:add'] as const,
    mutationFn: async (vars: { productId: string; quantity?: number; variantId?: string }) => {
      const response = await apiRequest('POST', '/api/cart', {
        productId: vars.productId,
        quantity: vars.quantity || 1,
        variantId: vars.variantId
      });
      const result = await response.json();
      return result.ok ? result.data : result;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: CART_KEY });
      const prev = qc.getQueryData<Cart>(CART_KEY);
      if (prev) {
        const existingItem = prev.items.find(i => i.productId === vars.productId && i.variantId === (vars.variantId ?? null));
        if (existingItem) {
          // Update existing item quantity
          const next: Cart = {
            ...prev,
            items: prev.items.map(i => 
              i.id === existingItem.id 
                ? { ...i, quantity: i.quantity + (vars.quantity ?? 1) }
                : i
            ),
          };
          qc.setQueryData(CART_KEY, next);
        } else {
          // Add new provisional item
          const next: Cart = {
            ...prev,
            items: [
              ...prev.items,
              {
                id: `temp-${Date.now()}`,
                productId: vars.productId,
                name: 'Adding...',
                price: 0,
                quantity: vars.quantity ?? 1,
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


