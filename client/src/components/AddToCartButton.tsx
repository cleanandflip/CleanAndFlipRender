import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { useLocation } from 'wouter';
import { ShoppingCart, Check } from 'lucide-react';

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
  const [isInCart, setIsInCart] = useState(false);
  const { toast } = useToast();
  const { addToCart, cartItems } = useCart();
  const [, setLocation] = useLocation();

  const effectiveStock = stock || 0;

  // Check if product is in cart
  useEffect(() => {
    const inCart = cartItems?.some(item => item.productId === productId);
    setIsInCart(inCart);
  }, [cartItems, productId]);

  const handleAddToCart = useMemo(
    () => debounce(async () => {
      if (loading) return;
      
      setLoading(true);
      setError(null);
      
      try {
        await addToCart({ productId, quantity });
        setIsInCart(true);
        
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

  if (isInCart) {
    return (
      <Button
        onClick={handleViewCart}
        variant="default"
        size={size}
        className={`bg-green-600 hover:bg-green-700 text-white transition-all duration-200 ${className}`}
      >
        <Check className="w-4 h-4 mr-2" />
        In Cart - View
      </Button>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={`bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 ${className} ${loading ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <>
          <LoadingSpinner size="small" color="white" className="mr-2" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
          {quantity > 1 && ` (${quantity})`}
        </>
      )}
    </Button>
  );
}