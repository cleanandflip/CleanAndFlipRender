import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ComponentType, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';

interface UnifiedButtonProps extends PropsWithChildren<{}> {
  variant?: Variant;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const variantMap: Record<Variant, React.ComponentProps<typeof Button>['variant']> = {
  primary: 'default',
  secondary: 'secondary',
  destructive: 'destructive',
  ghost: 'ghost',
  outline: 'outline',
};

export function UnifiedButton({
  variant = 'primary',
  icon: Icon,
  className,
  disabled,
  onClick,
  children,
}: UnifiedButtonProps) {
  return (
    <Button
      variant={variantMap[variant]}
      className={cn('inline-flex items-center gap-2', className)}
      disabled={disabled}
      onClick={onClick}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </Button>
  );
}

export default UnifiedButton;
