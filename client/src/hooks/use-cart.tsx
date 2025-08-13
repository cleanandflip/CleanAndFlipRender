import { useState, useEffect, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cartApi } from "@/api/cart";
import type { CartItem, Product, InsertCartItem } from "@shared/schema";

interface CartContextType {
  cartItems: (CartItem & { product: Product })[];
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
  addToCart: (item: { productId: string; quantity?: number }) => void;
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
    queryKey: ["cart"],
    queryFn: () => cartApi.get(),
    staleTime: 60 * 1000, // Cache for 1 minute to reduce network calls
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    refetchInterval: false, // Disable automatic polling
  });
  
  // Listen for product update events to refresh cart
  useEffect(() => {
    const handleProductUpdate = () => {
      // Invalidate and refetch cart when products change
      queryClient.invalidateQueries({ queryKey: ["cart"] });
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
    mutationFn: cartApi.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ 
        title: "Added to cart",
        description: "Item has been added to your cart." 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add to cart",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: cartApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: cartApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove item",
        description: error.message,
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
          cartApi.remove(item.id).catch(() => {
            // Failed to delete cart item, continuing with other items
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
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
  const addToCart = ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
    addToCartMutation.mutate({ productId, quantity });
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
