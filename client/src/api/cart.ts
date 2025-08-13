// Cart adapter + guard from punch list
import { useQuery } from '@tanstack/react-query';
import { CART_QK } from '@/lib/cartKeys';
import { apiRequest } from '@/lib/queryClient';

export function useCart() {
  return useQuery({
    queryKey: CART_QK,
    queryFn: async () => (await fetch('/api/cart')).json(),
    select: (raw: any) => {
      const items = raw?.items ?? raw?.lineItems ?? [];
      const subtotal = raw?.subtotal ?? items.reduce((s: any, i: any) => s + (i.price || 0) * (i.qty || 1), 0);
      return { items, subtotal };
    }
  });
}

// Cart and CartItem types
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string | null;
  product?: any;
}

export interface Cart {
  items: CartItem[];
  subtotal?: number;
}

// Legacy cartApi for backwards compatibility
export const cartApi = {
  get: () => apiRequest('/api/cart'),
  addItem: ({ productId, quantity = 1, variantId }: any) => 
    apiRequest('/api/cart', {
      method: 'POST',
      body: { productId, quantity, variantId }
    }),
  updateItem: (itemId: string, quantity: number) =>
    apiRequest(`/api/cart/${itemId}`, {
      method: 'PATCH', 
      body: { quantity }
    }),
  removeItem: (itemId: string) =>
    apiRequest(`/api/cart/${itemId}`, {
      method: 'DELETE'
    }),
  createShippingAddress: (address: any) =>
    apiRequest('/api/cart/shipping-address', {
      method: 'POST',
      body: address
    })
};