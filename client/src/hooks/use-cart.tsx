import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// SSOT Cart interfaces matching server structure exactly
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
    queryFn: async () => {
      console.log('Fetching cart data...');
      const response = await fetch('/api/cart', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Cart response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cart fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch cart: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Cart data received:', data);
      // SSOT FIX: Handle both old and new data structures
      if (data.ok && data.data) {
        return data.data; // Legacy structure
      }
      return data; // New structure
    },
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

// Clear entire cart
export function useClearCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear cart",
        variant: "destructive"
      });
    },
  });
}