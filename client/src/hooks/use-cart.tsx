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
    mutationKey: ['cart:updateItem'] as const,
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateItem(itemId, quantity),
    onSettled: () => qc.invalidateQueries({ queryKey: CART_QK }),
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cart:remove'] as const,
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onSettled: () => qc.invalidateQueries({ queryKey: CART_QK }),
  });
}

// Legacy context-style helpers for backward compatibility
export function useCartLegacy() {
  const { data: cart, isLoading } = useCart();
  const addMutation = useAddToCart();
  const updateMutation = useUpdateCartItem();  
  const removeMutation = useRemoveFromCart();
  
  const cartItems = cart?.items || [];
  const cartCount = cartItems.reduce((n, i) => n + i.quantity, 0);
  const cartTotal = cartItems.reduce((n, i) => n + (i.price * i.quantity), 0);
  
  return {
    cartItems,
    cartCount,
    cartTotal,
    isLoading,
    addToCart: (params: { productId: string; quantity?: number }) => addMutation.mutate(params),
    updateQuantity: (itemId: string, quantity: number) => updateMutation.mutate({ itemId, quantity }),
    removeFromCart: (itemId: string) => removeMutation.mutate(itemId),
    isInCart: (productId: string) => cartItems.some(i => i.productId === productId),
    removeProductFromCart: (productId: string) => {
      const item = cartItems.find(i => i.productId === productId);
      if (item) removeMutation.mutate(item.id);
    }
  };
}
