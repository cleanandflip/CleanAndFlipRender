import React from 'react';

interface ProductPriceProps {
  price: number | string;
  originalPrice?: number | string;
  size?: 'small' | 'default' | 'large';
  className?: string;
}

export const ProductPrice: React.FC<ProductPriceProps> = ({ 
  price, 
  originalPrice, 
  size = 'default',
  className = ''
}) => {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  const originalPriceNum = originalPrice ? (typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice) : null;
  
  const discount = originalPriceNum && originalPriceNum > priceNum 
    ? Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100) 
    : 0;
  
  const sizeClasses = {
    small: 'text-sm',
    default: 'text-lg',
    large: 'text-2xl'
  };

  const originalSizeClasses = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-lg'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`font-bold text-white ${sizeClasses[size]}`}>
        ${priceNum.toFixed(2)}
      </span>
      {originalPriceNum && originalPriceNum > priceNum && (
        <>
          <span className={`line-through text-gray-400 ${originalSizeClasses[size]}`}>
            ${originalPriceNum.toFixed(2)}
          </span>
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            -{discount}%
          </span>
        </>
      )}
    </div>
  );
};