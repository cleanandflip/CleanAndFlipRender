import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  max?: number;
  min?: number;
  size?: 'small' | 'default';
  className?: string;
  disabled?: boolean;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onQuantityChange,
  max = 99,
  min = 1,
  size = 'default',
  className = '',
  disabled = false
}) => {
  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min && value <= max) {
      onQuantityChange(value);
    }
  };

  const buttonSize = size === 'small' ? 'sm' : 'default';
  const inputSize = size === 'small' ? 'w-12 h-8 text-sm' : 'w-16 h-10';

  return (
    <div className={`flex items-center bg-input rounded-lg ${className}`}>
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={handleDecrease}
        disabled={disabled || quantity <= min}
        className="rounded-r-none border-r border-white/10"
      >
        <Minus size={size === 'small' ? 14 : 16} />
      </Button>
      
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className={`
          ${inputSize}
          bg-transparent text-center text-white font-medium
          border-none outline-none
          [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
        `}
      />
      
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={handleIncrease}
        disabled={disabled || quantity >= max}
        className="rounded-l-none border-l border-white/10"
      >
        <Plus size={size === 'small' ? 14 : 16} />
      </Button>
    </div>
  );
};