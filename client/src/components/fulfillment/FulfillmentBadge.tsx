import React from 'react';
import { Truck, Package } from 'lucide-react';
import type { FulfillmentMode } from '@shared/fulfillment';

interface FulfillmentBadgeProps {
  mode: FulfillmentMode;
  subtle?: boolean;
  className?: string;
}

export function FulfillmentBadge({ mode, subtle = false, className = '' }: FulfillmentBadgeProps) {
  const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-colors";
  
  if (mode === 'LOCAL_ONLY') {
    return (
      <div className={`${baseClasses} ${subtle 
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
        : 'bg-green-600 text-green-50 dark:bg-green-700 dark:text-green-100'
      } ${className}`}>
        <Truck className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Local delivery only</span>
      </div>
    );
  }

  if (mode === 'LOCAL_AND_SHIPPING') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className={`${baseClasses} ${subtle 
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
          : 'bg-green-600 text-green-50 dark:bg-green-700 dark:text-green-100'
        }`}>
          <Truck className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Local delivery</span>
        </div>
        <div className={`${baseClasses} ${subtle 
          ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' 
          : 'bg-gray-700 text-gray-50 dark:bg-gray-600 dark:text-gray-100'
        }`}>
          <Package className="w-3.5 h-3.5" aria-hidden="true" />
          <span>shipping</span>
        </div>
      </div>
    );
  }

  return null;
}

export default FulfillmentBadge;