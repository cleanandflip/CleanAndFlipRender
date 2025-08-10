/**
 * UNIFIED BUTTON COMPONENT - PHASE 4: BUTTON STANDARDIZATION
 * Enhanced with professional design system specifications
 * August 10, 2025 - Professional UI Modernization
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface UnifiedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon' | 'text' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const UnifiedButton = React.forwardRef<HTMLButtonElement, UnifiedButtonProps>(({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  const getButtonClasses = () => {
    // PHASE 4: Professional button specifications following design system
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
    
    // EXACT Height specifications from design system
    const sizeClasses = {
      xs: 'h-7 px-3 text-sm rounded-lg gap-2', // 28px - Tags, chips only
      sm: 'h-8 px-3 text-sm rounded-lg gap-2', // 32px - Secondary actions
      md: 'h-10 px-4 text-base rounded-lg gap-2 min-w-[120px]', // 40px - DEFAULT
      lg: 'h-12 px-6 text-base rounded-lg gap-2 min-w-[120px]', // 48px - Primary CTAs
      xl: 'h-14 px-8 text-lg rounded-lg gap-3 min-w-[140px]', // 56px - Hero buttons only
    };
    
    // Enhanced variant specifications
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm hover:shadow-md',
      secondary: 'border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 focus:ring-gray-500 bg-white dark:bg-gray-900',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500',
      ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 text-gray-700 dark:text-gray-300',
      icon: 'w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 flex-shrink-0',
      text: 'h-10 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 text-blue-600 dark:text-blue-400',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm hover:shadow-md',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md',
    };
    
    // Touch target compliance - minimum 44px
    const touchCompliant = size === 'xs' || size === 'sm' ? 'min-h-[44px]' : '';
    
    // Full width option
    const widthClass = fullWidth ? 'w-full' : '';
    
    return cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      touchCompliant,
      widthClass,
      className
    );
  };

  const getIconSize = () => {
    switch (size) {
      case 'xs': return 'w-3 h-3'; // xs - tiny indicators
      case 'sm': return 'w-4 h-4'; // sm - inline text icons
      case 'md': return 'w-5 h-5'; // md - standard button icons
      case 'lg': return 'w-6 h-6'; // lg - large buttons, navigation
      case 'xl': return 'w-8 h-8'; // xl - hero buttons
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
      ref={ref}
      className={getButtonClasses()}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

UnifiedButton.displayName = "UnifiedButton";

export default UnifiedButton;