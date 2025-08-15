import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useLocality } from "@/hooks/useLocality";
import { modeFromProduct } from "@shared/fulfillment";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";

interface AddToCartButtonProps {
  productId: string;
  product?: {
    is_local_delivery_available?: boolean;
    is_shipping_available?: boolean;
    name?: string;
    price?: string;
    images?: string[];
    brand?: string;
    stockQuantity?: number;
  };
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export default function AddToCartButton({ 
  productId, 
  product,
  className, 
  variant = "default",
  size = "default" 
}: AddToCartButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isHovering, setIsHovering] = useState(false);

  // Use the unified cart hooks and locality
  const { 
    cart, 
    addToCart, 
    removeByProduct, // compound key removal for authenticated users
    isAddingToCart, 
    isRemovingByProduct 
  } = useCart();
  const locality = useLocality(); // unified single source of truth

  const isInCart = cart?.data?.items?.some((item: any) => item.productId === productId) || false;
  
  // Check if this is LOCAL_ONLY product using unified system
  const fulfillmentMode = modeFromProduct(product || {});
  const isLocalOnly = fulfillmentMode === 'LOCAL_ONLY';
  const isBlocked = isLocalOnly && !locality.eligible;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive"
      });
      return;
    }
    
    if (isBlocked) {
      toast({
        title: "Not available in your area",
        description: "This item is local delivery only. Set a local default address or enter a local ZIP to order.",
        variant: "destructive"
      });
      return;
    }
    
    addToCart({ productId, quantity: 1 });
  };

  const handleRemoveFromCart = () => {
    if (isAuthenticated && productId) {
      // Use compound key removal for authenticated users
      removeByProduct(productId);
    } else {
      toast({
        title: "Sign in required",
        description: "Please sign in to manage your cart",
        variant: "destructive"
      });
    }
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
          "w-full px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 border-0 text-white flex items-center justify-center disabled:opacity-50",
          isHovering 
            ? "!bg-red-600 hover:!bg-red-600" 
            : "!bg-green-600 hover:!bg-green-600",
          className
        )}
        onClick={handleRemoveFromCart}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={isRemovingByProduct}
        data-testid={`button-remove-from-cart-${productId}`}
      >
        <div className="flex items-center justify-center">
          {isRemovingByProduct ? (
            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isHovering ? (
            <Minus className="w-4 h-4 mr-2" key="minus-icon" />
          ) : (
            <Check className="w-4 h-4 mr-2" key="check-icon" />
          )}
          {isHovering ? "Remove" : "In Cart"}
        </div>
      </button>
    );
  }

  // Not in cart - show Add to Cart button (disabled if blocked)
  if (isBlocked) {
    return (
      <Button
        size={size}
        className={cn("w-full bg-gray-400 text-gray-600 cursor-not-allowed", className)}
        disabled={true}
        data-testid={`button-add-to-cart-blocked-${productId}`}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Local delivery only
      </Button>
    );
  }

  return (
    <Button
      size={size}
      className={cn("w-full bg-blue-600 hover:bg-blue-700 text-white border-0", className)}
      onClick={handleAddToCart}
      disabled={isAddingToCart}
      data-testid={`button-add-to-cart-${productId}`}
    >
      {isAddingToCart ? (
        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <ShoppingCart className="w-4 h-4 mr-2" />
      )}
      {isAddingToCart ? "Adding..." : "Add to Cart"}
    </Button>
  );
}