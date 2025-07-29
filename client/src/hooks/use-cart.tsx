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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Mock user ID - replace with actual auth
const TEMP_USER_ID = "temp-user-id";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery<(CartItem & { product: Product })[]>({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      const response = await fetch(`/api/cart?userId=${TEMP_USER_ID}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      return response.json();
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (item: { productId: string; quantity: number }) => {
      const cartItem: InsertCartItem = {
        userId: TEMP_USER_ID,
        productId: item.productId,
        quantity: item.quantity,
      };
      
      const response = await apiRequest("POST", "/api/cart", cartItem);
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
      await Promise.all(
        cartItems.map(item => 
          apiRequest("DELETE", `/api/cart/${item.id}`)
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
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => {
    return total + (Number(item.product.price) * item.quantity);
  }, 0);

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

  const value: CartContextType = {
    cartItems,
    cartCount,
    cartTotal,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
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
