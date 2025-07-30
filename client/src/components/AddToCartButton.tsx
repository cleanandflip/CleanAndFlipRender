import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { ShoppingCart } from 'lucide-react';

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
  const { addToCart } = useCart();

  const effectiveStock = stock || 0;

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

  const isOutOfStock = effectiveStock === 0;
  const isDisabled = loading || isOutOfStock;

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={`${className} ${loading ? 'opacity-50' : ''} transition-opacity`}
    >
      {loading ? (
        <>
          <LoadingSpinner size="small" color="white" className="mr-2" />
          Adding...
        </>
      ) : isOutOfStock ? (
        'Out of Stock'
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