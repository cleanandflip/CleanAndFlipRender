import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface StockIndicatorProps {
  stock: number | null;
  showNumber?: boolean;
  size?: 'small' | 'default';
  className?: string;
}

export const StockIndicator: React.FC<StockIndicatorProps> = ({ 
  stock, 
  showNumber = false, 
  size = 'default',
  className = ''
}) => {
  const effectiveStock = stock || 0;
  const iconSize = size === 'small' ? 14 : 16;
  
  if (effectiveStock === 0) {
    return (
      <div className={`flex items-center gap-1 text-red-500 font-medium ${className}`}>
        <XCircle size={iconSize} />
        Out of Stock
      </div>
    );
  }
  
  if (effectiveStock <= 3) {
    return (
      <div className={`flex items-center gap-1 text-orange-500 font-medium ${className}`}>
        <AlertTriangle size={iconSize} />
        Only {effectiveStock} left!
      </div>
    );
  }
  
  if (showNumber) {
    return (
      <div className={`flex items-center gap-1 text-green-500 ${className}`}>
        <CheckCircle size={iconSize} />
        {effectiveStock} in stock
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-1 text-green-500 ${className}`}>
      <CheckCircle size={iconSize} />
      In Stock
    </div>
  );
};