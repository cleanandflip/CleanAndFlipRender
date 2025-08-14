import React from 'react';
import { FulfillmentBadge } from '@/components/fulfillment/FulfillmentBadge';
import { getFulfillmentModeFromProduct } from '@shared/fulfillment';
import type { FulfillmentMode } from '@shared/fulfillment';

interface ProductAvailabilityChipsProps {
  product: {
    isLocalDeliveryAvailable?: boolean;
    isShippingAvailable?: boolean;
  };
  size?: 'sm' | 'md' | 'lg';
  stacked?: boolean;
  className?: string;
}

export function ProductAvailabilityChips({ 
  product, 
  size = 'md',
  stacked = false,
  className = '' 
}: ProductAvailabilityChipsProps) {
  const mode = getFulfillmentModeFromProduct(product) as FulfillmentMode;
  
  if (!mode || (mode !== 'LOCAL_ONLY' && mode !== 'LOCAL_AND_SHIPPING')) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 mt-1 ${className}`}>
      <FulfillmentBadge 
        mode={mode} 
        size={size}
        stacked={stacked}
        showTooltips={true}
      />
    </div>
  );
}

export default ProductAvailabilityChips;