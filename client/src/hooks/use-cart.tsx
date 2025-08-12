import { useState, useEffect, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CartItem, Product, InsertCartItem } from "@shared/schema";

interface CartContextType {
  cartItems: (CartItem & { product: Product })[];
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
  addToCart: (item: { productId: string; quantity: number }) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  removeProductFromCart: (productId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cart items - Always fresh data, no caching
  const { data: cartItems = [], isLoading, refetch } = useQuery<(CartItem & { product: Product })[]>({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      const response = await fetch("/api/cart", {
        credentials: "include",
        // Force fresh data with cache-busting headers
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 0, // Always fetch fresh
    gcTime: 0, // No client-side caching
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
  
  // Listen for product update events to refresh cart
  useEffect(() => {
    const handleProductUpdate = () => {
      // Invalidate and refetch cart when products change
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      refetch();
    };
    
    const handleStorageChange = () => {
      // Refetch cart on storage changes
      refetch();
    };
    
    // Listen for global product update events
    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('storageChanged', handleStorageChange);
    window.addEventListener('productDeleted', handleProductUpdate);
    
    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('storageChanged', handleStorageChange);
      window.removeEventListener('productDeleted', handleProductUpdate);
    };
  }, [queryClient, refetch]);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (item: { productId: string; quantity: number }) => {
      const response = await apiRequest("POST", "/api/cart", {
        productId: item.productId,
        quantity: item.quantity,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add to cart",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity === 0) {
        const response = await apiRequest("DELETE", `/api/cart/${itemId}`);
        return response.json();
      } else {
        const response = await apiRequest("PUT", `/api/cart/${itemId}`, { quantity });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update cart",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/cart/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove item",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      // Delete all cart items for user
      await Promise.allSettled(
        (cartItems || []).map((item: { id: string }) => 
          apiRequest("DELETE", `/api/cart/${item.id}`).catch(() => {
            // Failed to delete cart item, continuing with other items
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to clear cart",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  const cartCount = cartItems?.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0) || 0;
  const cartTotal = cartItems?.reduce((total: number, item: { quantity: number; product: { price: string | number } }) => {
    return total + (Number(item.product.price) * item.quantity);
  }, 0) || 0;

  // Helper functions
  const addToCart = (item: { productId: string; quantity: number }) => {
    addToCartMutation.mutate(item);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    updateQuantityMutation.mutate({ itemId, quantity });
  };

  const removeFromCart = (itemId: string) => {
    removeFromCartMutation.mutate(itemId);
  };

  const clearCart = () => {
    clearCartMutation.mutate();
  };

  // Helper function to check if product is in cart
  const isInCart = (productId: string) => {
    return cartItems?.some((item: any) => item.productId === productId) || false;
  };

  // Helper function to remove product from cart by productId
  const removeProductFromCart = (productId: string) => {
    const cartItem = cartItems?.find((item: any) => item.productId === productId);
    if (cartItem) {
      removeFromCart(cartItem.id);
    }
  };

  const value: CartContextType = {
    cartItems: cartItems || [],
    cartCount,
    cartTotal,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isInCart,
    removeProductFromCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
