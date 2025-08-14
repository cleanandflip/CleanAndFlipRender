import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocality } from '@/hooks/useLocality';
import { useAddToCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { modeFromProduct } from '@shared/fulfillment';
import type { FulfillmentMode } from '@shared/fulfillment';
import fulfillmentCopy from '@/i18n/fulfillment';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'wouter';

interface AddToCartEnhancedProps {
  product: any;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function AddToCartEnhanced({ 
  product, 
  className = '', 
  variant = 'default', 
  size = 'default' 
}: AddToCartEnhancedProps) {
  const { user } = useAuth();
  const { isLocal, isLoading: localityLoading } = useLocality();
  const addToCart = useAddToCart();
  const { toast } = useToast();

  const mode = modeFromProduct(product) as FulfillmentMode;
  const isBlocked = mode === 'LOCAL_ONLY' && !isLocal;
  const isLoading = addToCart.isPending || localityLoading;

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    if (isBlocked) {
      toast({
        title: "Item not available",
        description: fulfillmentCopy.cart.blockedTooltip,
        variant: "destructive",
      });
      return;
    }

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: 1,
      });
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Failed to add to cart",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={variant} 
              size={size} 
              className={className}
              asChild
            >
              <Link href="/auth">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Sign in to buy
              </Link>
            </Button>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isBlocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size={size} 
              className={`${className} cursor-not-allowed opacity-50`}
              disabled
              aria-description={fulfillmentCopy.cart.blockedTooltip}
            >
              <MapPin className="w-4 h-4 mr-2" />
              {fulfillmentCopy.actions.unavailable}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{fulfillmentCopy.cart.blockedTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleAddToCart}
      disabled={isLoading}
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      {isLoading ? 'Adding...' : fulfillmentCopy.actions.addToCart}
    </Button>
  );
}

export default AddToCartEnhanced;