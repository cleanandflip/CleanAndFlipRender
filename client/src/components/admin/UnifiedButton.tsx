// UNIFIED BUTTON COMPONENT
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
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
    primary: "bg-blue-500 hover:bg-blue-600 text-white hover:shadow-[0_8px_25px_rgba(59,130,246,0.3),0_3px_10px_rgba(0,0,0,0.2)] hover:-translate-y-0.5",
    secondary: "bg-white/10 hover:bg-white/20 text-white border border-gray-700 hover:shadow-[0_8px_25px_rgba(59,130,246,0.15),0_3px_10px_rgba(0,0,0,0.1)] hover:-translate-y-0.5",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 hover:shadow-[0_8px_25px_rgba(239,68,68,0.3),0_3px_10px_rgba(0,0,0,0.2)] hover:-translate-y-0.5",
    ghost: "hover:bg-white/10 text-gray-400 hover:text-white hover:shadow-[0_8px_25px_rgba(59,130,246,0.1),0_3px_10px_rgba(0,0,0,0.05)] hover:-translate-y-0.5"
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
        "inline-flex items-center gap-2 rounded-lg relative overflow-hidden",
        "font-medium transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98] active:translate-y-0 active:shadow-inner",
        "before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        "before:transition-all before:duration-500 hover:before:left-full",
        "[&>svg]:transition-all [&>svg]:duration-300 hover:[&>svg]:scale-110 hover:[&>svg]:rotate-2",
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