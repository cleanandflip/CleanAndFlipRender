import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { ShoppingCart, Check, X, Lock } from 'lucide-react';

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
  const { user } = useAuth();
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
      
      // Check authentication first
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to manage your cart",
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/auth')}
              className="ml-2"
            >
              Sign In
            </Button>
          ),
        });
        return;
      }
      
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
    [productId, loading, removeProductFromCart, toast, user, setLocation]
  );

  const handleAddToCart = useMemo(
    () => debounce(async () => {
      if (loading) return;
      
      // Check authentication first
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add items to your cart",
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/auth')}
              className="ml-2"
            >
              Sign In
            </Button>
          ),
        });
        return;
      }
      
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
    }, 100), // 100ms debounce to prevent spam clicking
    [productId, loading, quantity, addToCart, toast, user, setLocation]
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
      className={`w-full ${!user ? 'bg-gray-600 hover:bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'} text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${className} ${loading ? 'opacity-50' : ''}`}
      title={!user ? 'Sign in required to add to cart' : 'Add to cart'}
    >
      {loading ? (
        <>
          <LoadingSpinner size="small" color="white" />
          Adding...
        </>
      ) : (
        <>
          {!user ? <Lock className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
          {!user ? 'Sign In to Shop' : `Add to Cart${quantity > 1 ? ` (${quantity})` : ''}`}
        </>
      )}
    </Button>
  );
}