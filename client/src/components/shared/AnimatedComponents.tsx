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

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const buttonStyles = cn(
    componentClasses.button.base,
    componentClasses.button.variants[variant],
    componentClasses.button.sizes[size],
    'btn-animate',
    className
  );

  return (
    <motion.button
      className={buttonStyles}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

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
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-[#3B82F6]' : 'bg-[#374151]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && onChange(!checked)}
        whileTap={{ scale: 0.95 }}
        disabled={disabled}
      >
        <motion.span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
          animate={{ x: checked ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>
      {label && (
        <span 
          className="text-sm font-medium"
          style={{ color: theme.colors.text.secondary }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center animate-fade-in"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#232937] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl max-w-md w-full mx-4 animate-slide-up"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <h2 
              className="text-lg font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              {title}
            </h2>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Loading Spinner Component
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      className={cn('animate-spin rounded-full border-2 border-gray-300', sizeClasses[size])}
      style={{ borderTopColor: theme.colors.brand.blue }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

// Badge Component
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className
}) => {
  const variants = {
    default: 'bg-[#374151] text-[#E5E7EB]',
    success: 'bg-[#065F46] text-[#A7F3D0]',
    warning: 'bg-[#92400E] text-[#FDE68A]',
    error: 'bg-[#991B1B] text-[#FECACA]',
    info: 'bg-[#1E40AF] text-[#BFDBFE]'
  };

  return (
    <motion.span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {children}
    </motion.span>
  );
};