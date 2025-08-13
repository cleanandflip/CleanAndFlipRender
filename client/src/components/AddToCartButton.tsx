import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

interface AddToCartButtonProps {
  productId: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function AddToCartButton({ 
  productId, 
  className, 
  variant = "default",
  size = "default" 
}: AddToCartButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isHovering, setIsHovering] = useState(false);

  // Query cart to check if item is already in cart
  const { data: cartData } = useQuery({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated,
    staleTime: 30000 // 30 seconds
  });

  const isInCart = (cartData as any)?.items?.some((item: any) => item.productId === productId) || false;

  // Optimistic add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/cart', { 
        productId, 
        quantity: 1 
      });
    },
    onMutate: async () => {
      // Cancel any outgoing queries
      await queryClient.cancelQueries({ queryKey: ['/api/cart'] });
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['/api/cart']);
      
      // Optimistically update the cache
      queryClient.setQueryData(['/api/cart'], (old: any) => {
        if (!old) return { items: [], subtotal: 0 };
        return {
          ...old,
          items: [...(old.items || []), { productId, quantity: 1 }]
        };
      });
      
      return { previousCart };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['/api/cart'], context?.previousCart);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart"
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    }
  });

  // Optimistic remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/cart/remove/${productId}`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['/api/cart'] });
      
      const previousCart = queryClient.getQueryData(['/api/cart']);
      
      // Optimistically remove from cache
      queryClient.setQueryData(['/api/cart'], (old: any) => {
        if (!old) return { items: [], subtotal: 0 };
        return {
          ...old,
          items: (old.items || []).filter((item: any) => item.productId !== productId)
        };
      });
      
      return { previousCart };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['/api/cart'], context?.previousCart);
      toast({
        title: "Error", 
        description: "Failed to remove item from cart",
        variant: "destructive"
      });
    },
    onSuccess: () => {
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart"
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    }
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive"
      });
      return;
    }
    addToCartMutation.mutate();
  };

  const handleRemoveFromCart = () => {
    if (!isAuthenticated) return;
    removeFromCartMutation.mutate();
  };

  // Not signed in - show blue Add to Cart button
  if (!isAuthenticated) {
    return (
      <Button
        size={size}
        className={cn("w-full bg-blue-600 hover:bg-blue-700 text-white border-0", className)}
        onClick={handleAddToCart}
        data-testid={`button-add-to-cart-${productId}`}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Add to Cart
      </Button>
    );
  }

  // In cart - show green button that turns red on hover with remove functionality
  if (isInCart) {
    return (
      <button
        className={cn(
          "w-full px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 border-0 text-white flex items-center justify-center",
          isHovering 
            ? "!bg-red-600 hover:!bg-red-600" 
            : "!bg-green-600 hover:!bg-green-600",
          className
        )}
        onClick={handleRemoveFromCart}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={removeFromCartMutation.isPending}
        data-testid={`button-remove-from-cart-${productId}`}
      >
        {removeFromCartMutation.isPending ? (
          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isHovering ? (
          <Minus className="w-4 h-4 mr-2" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        {isHovering ? "Remove" : "In Cart"}
      </button>
    );
  }

  // Not in cart - show blue Add to Cart button
  return (
    <Button
      size={size}
      className={cn("w-full bg-blue-600 hover:bg-blue-700 text-white border-0", className)}
      onClick={handleAddToCart}
      disabled={addToCartMutation.isPending}
      data-testid={`button-add-to-cart-${productId}`}
    >
      {addToCartMutation.isPending ? (
        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <ShoppingCart className="w-4 h-4 mr-2" />
      )}
      {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
    </Button>
  );
}

// Default export for compatibility
export default AddToCartButton;