import React from 'react';
import { cn } from '@/lib/utils';
import { CARDS } from '@/config/dimensions';

interface UnifiedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  glow?: boolean;
  variant?: 'default' | 'outlined' | 'elevated';
}

export const UnifiedCard: React.FC<UnifiedCardProps> = ({
  children,
  interactive = false,
  glow = false,
  variant = 'default',
  className,
  ...props
}) => {
  const baseClasses = cn(
    CARDS.borderRadius,
    'transition-all duration-200',
    {
      // Mobile-first padding
      [CARDS.padding.mobile]: true,
      [CARDS.padding.desktop]: true,
    }
  );

  const variantClasses = {
    default: cn(
      CARDS.shadow.default,
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
    ),
    outlined: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent',
    elevated: cn(
      CARDS.shadow.hover,
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
    ),
  };

  const interactiveClasses = interactive ? cn(
    'cursor-pointer',
    `hover:${CARDS.shadow.hover}`,
    'hover:-translate-y-1',
    'active:scale-95'
  ) : '';

  const glowClasses = glow ? 'hover:shadow-blue-500/25 hover:shadow-2xl' : '';

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        interactiveClasses,
        glowClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default UnifiedCard;