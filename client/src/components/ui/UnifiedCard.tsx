/**
 * UNIFIED CARD COMPONENT - PHASE 6: CARD STANDARDIZATION
 * Standardized card component following design system specifications
 * August 10, 2025 - Professional UI Modernization
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CARDS, INTERACTIONS } from '@/config/dimensions';

interface UnifiedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  interactive?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const UnifiedCard = React.forwardRef<HTMLDivElement, UnifiedCardProps>(({
  variant = 'default',
  interactive = false,
  glow = false,
  padding = 'md',
  className,
  children,
  ...props
}, ref) => {
  const getCardClasses = () => {
    // Base classes with consistent border radius (rounded-xl = 12px)
    const baseClasses = 'rounded-xl transition-all duration-200';
    
    // Padding specifications - responsive mobile/desktop
    const paddingClasses = {
      none: '',
      sm: 'p-3 sm:p-4',
      md: 'p-4 lg:p-6', // Mobile: 16px, Desktop: 24px (CARDS.container spec)
      lg: 'p-6 lg:p-8'
    };
    
    // Variant specifications
    const variantClasses = {
      default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      elevated: 'bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700',
      outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600',
      filled: 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
    };
    
    // Interactive states
    const interactiveClasses = interactive 
      ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-gray-500'
      : '';
    
    // Glow effect
    const glowClasses = glow 
      ? 'shadow-lg shadow-blue-500/20 border-blue-200 dark:border-blue-800'
      : '';

    return cn(
      baseClasses,
      paddingClasses[padding],
      variantClasses[variant],
      interactiveClasses,
      glowClasses,
      className
    );
  };

  return (
    <div
      ref={ref}
      className={getCardClasses()}
      {...props}
    >
      {children}
    </div>
  );
});

UnifiedCard.displayName = "UnifiedCard";

// Card Image component for consistent image styling
interface UnifiedCardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
}

export const UnifiedCardImage = React.forwardRef<HTMLImageElement, UnifiedCardImageProps>(({
  aspectRatio = 'square',
  className,
  ...props
}, ref) => {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };

  return (
    <div className={cn('overflow-hidden rounded-lg', aspectClasses[aspectRatio])}>
      <img
        ref={ref}
        className={cn('w-full h-full object-cover', className)}
        {...props}
      />
    </div>
  );
});

UnifiedCardImage.displayName = "UnifiedCardImage";

// Card Content component with consistent spacing
interface UnifiedCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export const UnifiedCardContent = React.forwardRef<HTMLDivElement, UnifiedCardContentProps>(({
  title,
  description,
  children,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-2', className)}
      {...props}
    >
      {title && (
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-base text-gray-600 dark:text-gray-300 mb-2">
          {description}
        </p>
      )}
      {children}
    </div>
  );
});

UnifiedCardContent.displayName = "UnifiedCardContent";

// Card Actions component with consistent button spacing
interface UnifiedCardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'justify';
}

export const UnifiedCardActions = React.forwardRef<HTMLDivElement, UnifiedCardActionsProps>(({
  align = 'left',
  className,
  children,
  ...props
}, ref) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    justify: 'justify-between'
  };

  return (
    <div
      ref={ref}
      className={cn('flex gap-3 mt-4', alignClasses[align], className)}
      {...props}
    >
      {children}
    </div>
  );
});

UnifiedCardActions.displayName = "UnifiedCardActions";

export default UnifiedCard;