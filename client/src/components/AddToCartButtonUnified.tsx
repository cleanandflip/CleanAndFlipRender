import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useLocality } from "@/hooks/useLocality";

interface AddToCartButtonUnifiedProps {
  productId: string;
  product?: {
    is_local_delivery_available?: boolean;
    is_shipping_available?: boolean;
  };
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export default function AddToCartButtonUnified({ 
  productId, 
  product,
  className, 
  variant = "default",
  size = "default" 
}: AddToCartButtonUnifiedProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isHovering, setIsHovering] = useState(false);

  // Use unified hooks
  const { cart, addToCart, removeFromCart, isAddingToCart, isRemovingFromCart } = useCart();
  const { data: locality } = useLocality();

  const isInCart = cart?.data?.items?.some((item: any) => item.productId === productId) || false;
  const cartItem = cart?.data?.items?.find((item: any) => item.productId === productId);

  // Check if product is restricted for non-local users
  const localOnly = product?.is_local_delivery_available && !product?.is_shipping_available;
  const isBlocked = !locality?.isLocal && localOnly;

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
        title: "Local Delivery Only",
        description: "Update your address to one in our Local Delivery area to order this item.",
        variant: "destructive"
      });
      return;
    }
    
    addToCart({ productId, quantity: 1 });
  };

  const handleRemoveFromCart = () => {
    if (!isAuthenticated || !cartItem) return;
    removeFromCart(cartItem.id);
  };

  // Not signed in - show blue Add to Cart button
  if (!isAuthenticated) {
    return (
      <Button
        size={size}
        className={cn("w-full bg-blue-600 hover:bg-blue-700 text-white border-0", className)}
        onClick={handleAddToCart}
        disabled={isAddingToCart}
        data-testid={`button-add-to-cart-${productId}`}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Add to Cart
      </Button>
    );
  }

  // Blocked due to locality restrictions
  if (isBlocked) {
    return (
      <Button
        size={size}
        variant="outline"
        className={cn("w-full text-gray-500 border-gray-300 cursor-not-allowed", className)}
        disabled
        title="Local Delivery only. Update your address to one in our Local Delivery area to order."
        data-testid={`button-blocked-${productId}`}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Local Delivery Only
      </Button>
    );
  }

  // Loading states
  if (isAddingToCart || isRemovingFromCart) {
    return (
      <Button
        size={size}
        className={cn("w-full", className)}
        disabled
        data-testid={`button-loading-${productId}`}
      >
        Adding...
      </Button>
    );
  }

  // Item is in cart - show green "In Cart" with hover remove
  if (isInCart) {
    return (
      <Button
        size={size}
        className={cn(
          "w-full transition-all duration-200 border-0",
          isHovering 
            ? "bg-red-600 hover:bg-red-700 text-white" 
            : "bg-green-600 hover:bg-green-700 text-white",
          className
        )}
        onClick={isHovering ? handleRemoveFromCart : undefined}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        data-testid={`button-in-cart-${productId}`}
      >
        {isHovering ? (
          <>
            <Minus className="h-4 w-4 mr-2" />
            Remove
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            In Cart ({cartItem?.quantity || 1})
          </>
        )}
      </Button>
    );
  }

  // Default: show Add to Cart button
  return (
    <Button
      size={size}
      className={cn("w-full bg-blue-600 hover:bg-blue-700 text-white border-0", className)}
      onClick={handleAddToCart}
      data-testid={`button-add-to-cart-${productId}`}
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      Add to Cart
    </Button>
  );
}