import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { useLocation } from 'wouter';
import { ShoppingCart, Check, X } from 'lucide-react';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface AddToCartButtonProps {
  productId: string;
  stock: number | null;
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
  quantity?: number;
}

export function AddToCartButton({ 
  productId, 
  stock, 
  className = "", 
  variant = "default",
  size = "default",
  quantity = 1 
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { addToCart, isInCart, removeProductFromCart } = useCart();
  const [, setLocation] = useLocation();
  
  // Check if product is in cart using the cart context helper
  const productInCart = isInCart(productId);

  const effectiveStock = stock || 0;

  // Handle remove from cart
  const handleRemoveFromCart = useMemo(
    () => debounce(async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (loading) return;
      
      setLoading(true);
      try {
        removeProductFromCart(productId);
        toast({
          title: "Removed from cart",
          description: "Item has been removed from your cart",
        });
      } catch (error: any) {
        toast({
          title: "Remove failed",
          description: error?.message || 'Failed to remove from cart',
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, 500),
    [productId, loading, removeProductFromCart, toast]
  );

  const handleAddToCart = useMemo(
    () => debounce(async () => {
      if (loading) return;
      
      setLoading(true);
      setError(null);
      
      try {
        await addToCart({ productId, quantity });
        
        // Success feedback
        toast({
          title: "Added to cart",
          description: `${quantity > 1 ? `${quantity} items` : 'Item'} added successfully`,
        });
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to add to cart';
        setError(errorMessage);
        toast({
          title: "Add to cart failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, 500), // 500ms debounce to prevent spam clicking
    [productId, loading, quantity, addToCart, toast]
  );

  const handleViewCart = () => {
    setLocation('/cart');
  };

  const isOutOfStock = effectiveStock === 0;
  const isDisabled = loading || isOutOfStock;

  if (isOutOfStock) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={`opacity-50 cursor-not-allowed ${className}`}
      >
        Out of Stock
      </Button>
    );
  }

  if (productInCart) {
    return (
      <div className="relative group">
        <Button
          onClick={handleViewCart}
          variant="default"
          size={size}
          className={`w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${className}`}
        >
          <Check className="w-5 h-5" />
          In Cart - View
        </Button>
        {/* Small red X remove button - appears on hover */}
        <button
          onClick={handleRemoveFromCart}
          disabled={loading}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center disabled:opacity-50 z-10"
          title="Remove from cart"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={`w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${className} ${loading ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <>
          <LoadingSpinner size="small" color="white" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
          {quantity > 1 && ` (${quantity})`}
        </>
      )}
    </Button>
  );
}