import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { globalDesignSystem as theme } from '@/styles/design-system/theme';
import { componentClasses } from '@/styles/design-system/components';
import { cn } from '@/lib/utils';

// Button Component
interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'as'> {
  variant?: 'primary' | 'secondary' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}, ref) => {
  const buttonStyles = cn(
    componentClasses.button.base,
    componentClasses.button.sizes[size],
    'btn-animate',
    className
  );

  return (
    <motion.button
      ref={ref}
      className={buttonStyles}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';

// Card Component
interface CardProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  glow = false,
  className,
  children,
  ...props
}) => {
  const cardStyles = cn(
    componentClasses.card.base,
    interactive && componentClasses.card.interactive,
    glow && componentClasses.card.glow,
    'card-hover',
    className
  );

  return (
    <motion.div
      className={cardStyles}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={interactive ? { y: -4 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Input Component
interface InputProps extends HTMLMotionProps<"input"> {
  variant?: 'default' | 'error' | 'success';
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  label,
  error,
  className,
  ...props
}, ref) => {
  const inputStyles = cn(
    componentClasses.input.base,
    componentClasses.input.variants[variant],
    error && componentClasses.input.variants.error,
    className
  );

  return (
    <div className="space-y-1">
      {label && (
        <label 
          className="block text-sm font-medium"
          style={{ color: theme.colors.text.secondary }}
        >
          {label}
        </label>
      )}
      <motion.input
        ref={ref}
        className={inputStyles}
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.1 }}
        {...props}
      />
      {error && (
        <motion.p
          className="text-sm"
          style={{ color: theme.colors.status.error }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Toggle Component
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false
}) => {
  return (
    <div className="flex items-center space-x-3">
      <motion.button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
          checked ? "bg-blue-600" : "bg-gray-600",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
      >
        <motion.span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
          animate={{ x: checked ? 24 : 4 }}
          transition={{ duration: 0.2 }}
        />
      </motion.button>
      {label && (
        <label 
          className="text-sm font-medium"
          style={{ color: theme.colors.text.secondary }}
        >
          {label}
        </label>
      )}
    </div>
  );
};

// Loader Component
interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = theme.colors.brand.blue
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <motion.div
      className={cn("animate-spin rounded-full border-2 border-gray-600", sizeClasses[size])}
      style={{ borderTopColor: color }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

// Badge Component
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className
}) => {
  const variantStyles = {
    default: 'bg-gray-600 text-gray-100',
    success: 'bg-green-600 text-green-100',
    warning: 'bg-yellow-600 text-yellow-100',
    error: 'bg-red-600 text-red-100'
  };

  return (
    <motion.span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.span>
  );
};