// TanStack Query v5 friendly API calls
import { Address } from "./addresses";

export type Cart = {
  id?: string;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    variantId?: string | null;
    product?: {
      name: string;
      price: number;
      brand?: string;
    };
  }>;
  shippingAddressId?: string | null;
  subtotal?: number;
  total?: number;
};

export interface CartShippingResponse {
  ok: boolean;
  shippingAddress: Address;
}

const j = async (res: Response) => {
  if (!res.ok) throw new Error(await res.text() || `${res.status}`);
  return res.json();
};

export const cartApi = {
  get: async (): Promise<Cart> => {
    const response = await j(await fetch('/api/cart', { credentials: 'include' }));
    // Server now returns { id, items, subtotal, total, shippingAddressId }
    return {
      id: response.id || 'cart',
      items: response.items || [],
      subtotal: response.subtotal || 0,
      total: response.total || 0,
      shippingAddressId: response.shippingAddressId || null
    };
  },

  addItem: async (payload: { productId: string; quantity?: number; variantId?: string | null }): Promise<Cart> => {
    const result = await j(await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ quantity: 1, variantId: null, ...payload }),
    }));
    // Re-fetch cart to get updated state
    return cartApi.get();
  },

  updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
    await j(await fetch(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ quantity }),
    }));
    return cartApi.get();
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    await j(await fetch(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
      credentials: 'include',
    }));
    return cartApi.get();
  },

  validate: async () =>
    j(await fetch('/api/cart/validate', { method: 'POST', credentials: 'include' })),

  // SSOT address methods (keep existing)
  setShippingAddressById: async (addressId: string): Promise<CartShippingResponse> => {
    return j(await fetch(`/api/cart/shipping-address`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ addressId })
    }));
  },

  createShippingAddress: async (addressData: any): Promise<Address> => {
    return j(await fetch(`/api/cart/shipping-address`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(addressData)
    }));
  }
};