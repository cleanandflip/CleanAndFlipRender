// client/src/components/shared/NewAnimatedComponents.tsx
// Test components with "New" prefix to test alongside old ones

import { motion } from 'framer-motion';
import { componentClasses, cn } from '@/styles/design-system/components';
import { ReactNode, ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from 'react';

// New Button Component with Design System
interface NewButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'danger';
  size?: 'sm' | 'base' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

export const NewButton = ({ 
  variant = 'primary', 
  size = 'base', 
  children, 
  isLoading = false,
  className = '',
  disabled,
  onClick,
  ...props 
}: NewButtonProps) => {
  const baseClasses = componentClasses.buttons[variant];
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    base: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        baseClasses,
        sizeClasses[size],
        'animate-fade-in',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
      type={props.type || 'button'}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

// New Card Component with Design System
interface NewCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'elevated';
  padding?: 'sm' | 'base' | 'lg';
  children: ReactNode;
  animate?: boolean;
}

export const NewCard = ({ 
  variant = 'glass', 
  padding = 'base', 
  children, 
  animate = true,
  className = '',
  onClick,
  ...props 
}: NewCardProps) => {
  const baseClasses = componentClasses.cards[variant];
  const paddingClasses = {
    sm: 'p-4',
    base: 'p-6',
    lg: 'p-8'
  };
  
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          baseClasses,
          paddingClasses[padding],
          'animate-fade-in hover-lift',
          className
        )}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }
  
  return (
    <div
      className={cn(
        baseClasses,
        paddingClasses[padding],
        'animate-fade-in hover-lift',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// New Badge Component with Design System
interface NewBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'neutral';
  children: ReactNode;
}

export const NewBadge = ({ 
  variant = 'default', 
  children, 
  className = '',
  ...props 
}: NewBadgeProps) => {
  const baseClasses = componentClasses.badges[variant];

  return (
    <span
      className={cn(
        baseClasses,
        'animate-scale-in',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// New Input Component with Design System
interface NewInputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'base' | 'search';
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const NewInput = ({ 
  variant = 'base', 
  className = '',
  ...props 
}: NewInputProps) => {
  const baseClasses = componentClasses.inputs[variant];

  return (
    <input
      className={cn(
        baseClasses,
        'animate-fade-in',
        className
      )}
      {...props}
    />
  );
};

// Design System Test Component
export const DesignSystemTest = () => {
  const tests = [
    { name: 'Colors match design', status: 'pending' },
    { name: 'Animations work smoothly', status: 'pending' },
    { name: 'Dark theme consistent', status: 'pending' },
    { name: 'Buttons have hover states', status: 'pending' },
    { name: 'Cards have proper shadows', status: 'pending' },
    { name: 'Text is readable', status: 'pending' },
    { name: 'Glass morphism works', status: 'pending' },
    { name: 'Mobile responsive', status: 'pending' }
  ];
  
  return (
    <div className="fixed bottom-4 left-4 bg-[var(--color-bg-secondary)] p-4 rounded-lg max-w-xs border border-[var(--color-border-default)] shadow-lg z-50">
      <h3 className="text-[var(--color-text-primary)] font-bold mb-2">Design System Test</h3>
      <div className="space-y-2 mb-4">
        {tests.map(test => (
          <label key={test.name} className="flex items-center text-[var(--color-text-secondary)] text-sm">
            <input type="checkbox" className="mr-2" />
            {test.name}
          </label>
        ))}
      </div>
      
      {/* Component Tests */}
      <div className="space-y-2">
        <p className="text-[var(--color-text-muted)] text-xs">Component Tests:</p>
        
        <div className="flex gap-2">
          <NewButton variant="primary" size="sm">New</NewButton>
          <NewButton variant="secondary" size="sm">Btn</NewButton>
        </div>
        
        <NewCard variant="glass" padding="sm">
          <NewBadge variant="success">Test</NewBadge>
        </NewCard>
        
        <NewInput placeholder="Test input..." className="w-full" />
      </div>
    </div>
  );
};

// Component comparison for testing
export const ComponentComparison = ({ children }: { children: ReactNode }) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-default)] shadow-lg z-50">
      <p className="text-[var(--color-text-primary)] mb-2 font-medium">Design System Comparison:</p>
      {children}
    </div>
  );
};