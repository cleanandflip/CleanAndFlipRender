import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  className?: string;
  color?: 'default' | 'white' | 'blue';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'default', 
  className = '',
  color = 'default'
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colorClasses = {
    default: 'border-gray-700 border-t-gray-900',
    white: 'border-white/30 border-t-white',
    blue: 'border-blue-200 border-t-blue-600'
  };
  
  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]}
        ${className} 
        animate-spin rounded-full border-2
      `} 
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};