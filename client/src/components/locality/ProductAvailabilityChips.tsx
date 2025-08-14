import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Truck, Package } from 'lucide-react';
import { modeFromProduct, getFulfillmentLabel } from '@shared/fulfillment';

interface ProductAvailabilityChipsProps {
  product: any;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProductAvailabilityChips({ product, className = '', size = 'md' }: ProductAvailabilityChipsProps) {
  const mode = modeFromProduct(product);
  const local = product?.is_local_delivery_available ?? product?.isLocalDeliveryAvailable ?? false;
  const shipping = product?.is_shipping_available ?? product?.isShippingAvailable ?? false;
  
  const chipSize = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-2'
  }[size];

  return (
    <div className={`flex gap-1 flex-wrap ${className}`}>
      {local && (
        <Badge 
          variant="secondary" 
          className={`${chipSize} bg-green-100 text-green-800 border-green-200 flex items-center gap-1`}
        >
          <Truck className="h-3 w-3" />
          Local delivery
        </Badge>
      )}
      {shipping && (
        <Badge 
          variant="secondary" 
          className={`${chipSize} bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1`}
        >
          <Package className="h-3 w-3" />
          Shipping
        </Badge>
      )}
      {!local && !shipping && (
        <Badge 
          variant="secondary" 
          className={`${chipSize} bg-gray-100 text-gray-800 border-gray-200`}
        >
          Contact for availability
        </Badge>
      )}
    </div>
  );
}

export default ProductAvailabilityChips;