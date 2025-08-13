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
      // SSOT: Return unified structure that components expect
      return data.data ? data.data : { items: [], subtotal: 0, total: 0, id: null, shippingAddressId: null };
    },
    staleTime: 5000, // 5 seconds cache for faster updates
    refetchOnWindowFocus: false,
  });
}

// Add to cart mutation with optimistic updates
export function useAddToCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (vars: { productId: string; quantity?: number; productData?: CartProduct }) => {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: vars.productId,
          quantity: vars.quantity || 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to cart');
      }

      return response.json();
    },
    onMutate: async (vars) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      
      // Optimistically update the cache
      if (vars.productData) {
        const previousCart = queryClient.getQueryData<Cart>(CART_KEY);
        
        if (previousCart) {
          const existingItemIndex = previousCart.items.findIndex(
            item => item.productId === vars.productId
          );
          
          const newCart = { ...previousCart };
          
          if (existingItemIndex >= 0) {
            // Update existing item
            newCart.items[existingItemIndex] = {
              ...newCart.items[existingItemIndex],
              quantity: newCart.items[existingItemIndex].quantity + (vars.quantity || 1)
            };
          } else {
            // Add new item
            const newItem: CartItem = {
              id: `temp-${Date.now()}`, // Temporary ID
              productId: vars.productId,
              quantity: vars.quantity || 1,
              product: vars.productData
            };
            newCart.items.push(newItem);
          }
          
          // Recalculate totals
          newCart.subtotal = newCart.items.reduce((sum, item) => 
            sum + (parseFloat(item.product.price) * item.quantity), 0
          );
          newCart.total = newCart.subtotal;
          
          queryClient.setQueryData<Cart>(CART_KEY, newCart);
        }
      }
      
      return { previousCart: queryClient.getQueryData<Cart>(CART_KEY) };
    },
    onSuccess: () => {
      // Invalidate to get the real data from server
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart"
      });
    },
    onError: (error: any, vars, context) => {
      // Rollback the optimistic update
      if (context?.previousCart) {
        queryClient.setQueryData(CART_KEY, context.previousCart);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive"
      });
    },
  });
}

// Update cart item quantity with optimistic updates
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const response = await fetch(`/api/cart/items/${productId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update cart item');
      }
      
      return response.json();
    },
    onMutate: async ({ productId, quantity }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<Cart>(CART_KEY);
      
      // Optimistically update the cache
      if (previousCart) {
        const newCart = { ...previousCart };
        const itemIndex = newCart.items.findIndex(item => item.productId === productId);
        
        if (itemIndex >= 0) {
          newCart.items[itemIndex] = {
            ...newCart.items[itemIndex],
            quantity
          };
          
          // Recalculate totals
          newCart.subtotal = newCart.items.reduce((sum, item) => 
            sum + (parseFloat(item.product.price) * item.quantity), 0
          );
          newCart.total = newCart.subtotal;
          
          queryClient.setQueryData<Cart>(CART_KEY, newCart);
        }
      }
      
      return { previousCart };
    },
    onSuccess: () => {
      // Just invalidate, don't force refetch - let stale data handle it
      queryClient.invalidateQueries({ queryKey: CART_KEY });
    },
    onError: (error: any, variables, context) => {
      // Rollback the optimistic update
      if (context?.previousCart) {
        queryClient.setQueryData(CART_KEY, context.previousCart);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update cart item",
        variant: "destructive"
      });
    },
  });
}

// Remove from cart mutation with optimistic updates
export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/cart/items/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove from cart');
      }
      
      return response.json();
    },
    onMutate: async (productId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<Cart>(CART_KEY);
      
      // Optimistically remove the item
      if (previousCart) {
        const newCart = {
          ...previousCart,
          items: previousCart.items.filter(item => item.productId !== productId)
        };
        
        // Recalculate totals
        newCart.subtotal = newCart.items.reduce((sum, item) => 
          sum + (parseFloat(item.product.price) * item.quantity), 0
        );
        newCart.total = newCart.subtotal;
        
        queryClient.setQueryData<Cart>(CART_KEY, newCart);
      }
      
      return { previousCart };
    },
    onSuccess: () => {
      // Just invalidate, don't force refetch
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      toast({
        title: "Item removed", 
        description: "Item has been removed from your cart"
      });
    },
    onError: (error: any, productId, context) => {
      // Rollback the optimistic update
      if (context?.previousCart) {
        queryClient.setQueryData(CART_KEY, context.previousCart);
      }
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