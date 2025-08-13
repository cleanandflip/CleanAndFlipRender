import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi, Cart } from '@/api/cart';

export const CART_QK = ['cart'] as const;

export function useCart() {
  return useQuery({
    queryKey: CART_QK,
    queryFn: cartApi.get,
    staleTime: 1000 * 30,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cart:add'] as const,
    mutationFn: cartApi.addItem,
    // Optimistic update
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: CART_QK });
      const prev = qc.getQueryData<Cart>(CART_QK);
      if (prev) {
        const next: Cart = {
          ...prev,
          items: (() => {
            const hit = prev.items.find(i => i.productId === vars.productId && i.variantId === (vars.variantId ?? null));
            if (hit) {
              return prev.items.map(i => i.id === hit.id ? { ...i, quantity: i.quantity + (vars.quantity ?? 1) } : i);
            }
            // provisional item for UX; server will reconcile id
            return prev.items.concat({
              id: `temp-${Date.now()}`,
              productId: vars.productId,
              name: 'Updating…',
              price: 0,
              quantity: vars.quantity ?? 1,
              variantId: vars.variantId ?? null,
            });
          })(),
        };
        qc.setQueryData(CART_QK, next);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(CART_QK, ctx.prev);
    },
    onSettled: () => {
      // Always refetch real server cart
      qc.invalidateQueries({ queryKey: CART_QK });
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cart:update'] as const,
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => 
      cartApi.updateItem(itemId, quantity),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CART_QK });
    },
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cart:remove'] as const,
    mutationFn: cartApi.removeItem,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CART_QK });
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


