// ADDITIVE: Clean fulfillment chip component with professional styling
import React from 'react';
import { Truck, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { modeFromProduct } from '@shared/fulfillment';

interface ProductFulfillmentChipProps {
  product: {
    isLocalDeliveryAvailable?: boolean;
    isShippingAvailable?: boolean;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProductFulfillmentChip({ 
  product, 
  className,
  size = 'sm' 
}: ProductFulfillmentChipProps) {
  const mode = modeFromProduct(product);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5', 
    lg: 'text-base px-4 py-2'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (mode === 'LOCAL_ONLY') {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700",
        sizeClasses[size],
        className
      )}>
        <Home className={iconSizes[size]} />
        Local delivery only
      </div>
    );
  }

  if (mode === 'SHIPPING_ONLY') {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700",
        sizeClasses[size],
        className
      )}>
        <Truck className={iconSizes[size]} />
        Shipping only
      </div>
    );
  }

  if (mode === 'LOCAL_AND_SHIPPING') {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700",
        sizeClasses[size],
        className
      )}>
        <div className="flex items-center gap-1">
          <Home className={iconSizes[size]} />
          <span className="text-purple-400">+</span>
          <Truck className={iconSizes[size]} />
        </div>
        Local + shipping
      </div>
    );
  }

  // NONE - don't render anything
  return null;
}

export default ProductFulfillmentChip;