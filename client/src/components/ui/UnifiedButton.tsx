import React from 'react';
import { cn } from '@/lib/utils';
import { BUTTONS, ICONS } from '@/config/dimensions';

interface UnifiedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon' | 'text' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children?: React.ReactNode;
}

export const UnifiedButton: React.FC<UnifiedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    // Size classes
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm rounded-lg gap-2',
      md: 'h-10 px-4 text-base rounded-lg gap-2 min-w-[120px]',
      lg: 'h-12 px-6 text-base rounded-lg gap-2 min-w-[120px]',
      xl: 'h-14 px-8 text-lg rounded-lg gap-3 min-w-[140px]',
    };
    
    // Variant classes
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 focus:ring-gray-500',
      icon: 'w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
      text: 'h-10 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    };
    
    return cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      className
    );
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-5 h-5';
      case 'lg': return 'w-6 h-6';
      case 'xl': return 'w-6 h-6';
      default: return 'w-5 h-5';
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <div className={cn('animate-spin border-2 border-current border-t-transparent rounded-full', getIconSize())} />
          {children && <span>Loading...</span>}
        </>
      );
    }

    if (variant === 'icon' && icon) {
      return React.cloneElement(icon as React.ReactElement, {
        className: cn(getIconSize(), (icon as React.ReactElement).props.className)
      });
    }

    return (
      <>
        {icon && iconPosition === 'left' && 
          React.cloneElement(icon as React.ReactElement, {
            className: cn(getIconSize(), (icon as React.ReactElement).props.className)
          })
        }
        {children}
        {icon && iconPosition === 'right' && 
          React.cloneElement(icon as React.ReactElement, {
            className: cn(getIconSize(), (icon as React.ReactElement).props.className)
          })
        }
      </>
    );
  };

  return (
    <button
      className={getButtonClasses()}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default UnifiedButton;