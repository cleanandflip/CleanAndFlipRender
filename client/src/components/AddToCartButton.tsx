import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useLocality } from "@/hooks/useLocality";
import { modeFromProduct } from "@shared/fulfillment";
import { computeEffectiveAvailability } from "@shared/availability";
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

  // Use the V2 cart hooks and locality
  const { 
    data: cart, 
    addToCart, 
    removeByProduct,
    isAddingToCart, 
    isRemovingByProduct,
    isInCart,
    getItemQuantity
  } = useCart();
  const { data: locality, isLoading: localityLoading } = useLocality();

  const itemInCart = isInCart(productId);
  const currentQuantity = getItemQuantity(productId);
  
  // Use SSOT computeEffectiveAvailability instead of direct checks
  const productMode = modeFromProduct(product || {});
  const userMode = locality?.effectiveModeForUser || 'NONE';
  const effectiveness = productMode ? computeEffectiveAvailability(productMode, userMode) : 'ADD_ALLOWED';
  const isBlocked = effectiveness === 'BLOCKED';

  const handleAddToCart = async () => {
    console.log('🔵 AddToCart clicked!', { productId, isBlocked, locality });
    
    if (isBlocked) {
      const reasons = locality?.reasons || ["This item is local delivery only"];
      console.log('🔴 Blocked by locality:', reasons);
      toast({
        title: "Not available in your area",
        description: reasons[0] || "Set a local default address or enter a local ZIP to order.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log('🟢 Adding to cart...', { productId, qty: 1 });
      await addToCart({ productId, qty: 1 }); // V2 API - uses qty field
      console.log('✅ Successfully added to cart');
      toast({
        title: "Added to cart",
        description: `${product?.name || 'Item'} has been added to your cart.`,
        variant: "default"
      });
    } catch (error) {
      console.error('🔴 AddToCart error:', error);
      toast({
        title: "Failed to add to cart",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromCart = async () => {
    console.log('🔵 RemoveFromCart clicked!', { productId });
    try {
      await removeByProduct(productId);
      console.log('✅ Successfully removed from cart');
      toast({
        title: "Removed from cart",
        description: `${product?.name || 'Item'} has been removed from your cart.`,
        variant: "default"
      });
    } catch (error) {
      console.error('🔴 RemoveFromCart error:', error);
      toast({
        title: "Failed to remove from cart",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  // Remove the authentication check - cart works for all users

  // In cart - show green button that turns red on hover with remove functionality
  if (itemInCart) {
    return (
      <button
        type="button"
        className={cn(
          "w-full px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 border-0 text-white flex items-center justify-center disabled:opacity-50",
          isHovering 
            ? "!bg-red-600 hover:!bg-red-600" 
            : "!bg-green-600 hover:!bg-green-600",
          className
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleRemoveFromCart();
        }}
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
        type="button"
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
      type="button"
      size={size}
      className={cn("w-full bg-blue-600 hover:bg-blue-700 text-white border-0", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAddToCart();
      }}
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