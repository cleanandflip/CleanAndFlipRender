// UNIFIED BUTTON COMPONENT
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function UnifiedButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  onClick,
  disabled = false,
  className
}: UnifiedButtonProps) {
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-white/10 hover:bg-white/20 text-white border border-gray-700",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50",
    ghost: "hover:bg-white/10 text-gray-400 hover:text-white",
    outline: "bg-transparent hover:bg-white/10 text-gray-300 border border-gray-600 hover:border-gray-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg",
        "font-medium transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}