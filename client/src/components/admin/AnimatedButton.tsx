// ANIMATED BUTTON WITH LOADING STATES
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: LucideIcon;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedButton({
  children,
  icon: Icon,
  loading = false,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-gray-700',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50',
    success: 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'font-medium rounded-lg',
        'transition-all duration-200 ease-out',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
        'group overflow-hidden',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* Background animation */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      {/* Content */}
      <span className="relative flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : Icon ? (
          <Icon className={cn(
            "w-4 h-4 transition-transform duration-200",
            !loading && "group-hover:rotate-12"
          )} />
        ) : null}
        <span>{loading ? 'Loading...' : children}</span>
      </span>
      
      {/* Ripple effect on click */}
      <span className="absolute inset-0 rounded-lg">
        <span className="absolute inset-0 rounded-lg bg-white opacity-0 group-active:opacity-20 transition-opacity" />
      </span>
    </button>
  );
}