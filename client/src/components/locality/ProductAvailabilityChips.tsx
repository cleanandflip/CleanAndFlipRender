import React from 'react';
import { FulfillmentBadge } from '@/components/fulfillment/FulfillmentBadge';
import { modeFromProduct } from '@shared/fulfillment';
import type { FulfillmentMode } from '@shared/fulfillment';

interface ProductAvailabilityChipsProps {
  product: any;
  className?: string;
  subtle?: boolean;
}

export function ProductAvailabilityChips({ product, className = '', subtle = false }: ProductAvailabilityChipsProps) {
  const mode = modeFromProduct(product) as FulfillmentMode;
  
  if (!mode || (mode !== 'LOCAL_ONLY' && mode !== 'LOCAL_AND_SHIPPING')) {
    return null;
  }

  return (
    <FulfillmentBadge 
      mode={mode} 
      subtle={subtle}
      className={className}
    />
  );
}

export default ProductAvailabilityChips;