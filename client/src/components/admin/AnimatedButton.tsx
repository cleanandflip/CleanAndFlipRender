// UNIFIED ANIMATED BUTTON - Uses standardized UnifiedButton with animations
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { UnifiedButton } from '@/components/ui/UnifiedButton';
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
  // Map to UnifiedButton variants
  const unifiedVariant = variant === 'danger' ? 'danger' : 
                        variant === 'success' ? 'success' : 
                        variant;

  return (
    <UnifiedButton
      variant={unifiedVariant}
      size={size}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      icon={Icon ? <Icon className="w-4 h-4" /> : undefined}
      className={cn(
        'group relative overflow-hidden',
        'hover:scale-105 active:scale-95 transition-transform duration-200 ease-out',
        'disabled:hover:scale-100',
        className
      )}
      {...props}
    >
      {/* Enhanced animation overlay */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      {/* Ripple effect on click */}
      <span className="absolute inset-0 rounded-lg">
        <span className="absolute inset-0 rounded-lg bg-white opacity-0 group-active:opacity-20 transition-opacity" />
      </span>
      
      {/* Content with icon rotation */}
      <span className="relative flex items-center gap-2">
        {Icon && !loading && (
          <Icon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
        )}
        <span>{children}</span>
      </span>
    </UnifiedButton>
  );
}