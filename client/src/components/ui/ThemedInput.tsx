import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ThemedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'ghost' | 'filled';
}

interface ThemedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'ghost' | 'filled';
}

export const ThemedInput = React.forwardRef<HTMLInputElement, ThemedInputProps>(
  ({ label, error, variant = 'default', className, ...props }, ref) => {
    const inputClasses = cn(
      'bg-input border-border text-input-foreground placeholder:text-muted-foreground',
      'focus:border-primary focus:ring-2 focus:ring-primary/20',
      'transition-all duration-200',
      {
        'bg-transparent border-muted': variant === 'ghost',
        'bg-muted border-muted': variant === 'filled',
      },
      className
    );

    return (
      <div className="space-y-2">
        {label && (
          <Label className="text-foreground font-medium">
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}
      </div>
    );
  }
);

ThemedInput.displayName = 'ThemedInput';

export const ThemedTextarea = React.forwardRef<HTMLTextAreaElement, ThemedTextareaProps>(
  ({ label, error, variant = 'default', className, ...props }, ref) => {
    const textareaClasses = cn(
      'bg-input border-border text-input-foreground placeholder:text-muted-foreground',
      'focus:border-primary focus:ring-2 focus:ring-primary/20',
      'transition-all duration-200',
      {
        'bg-transparent border-muted': variant === 'ghost',
        'bg-muted border-muted': variant === 'filled',
      },
      className
    );

    return (
      <div className="space-y-2">
        {label && (
          <Label className="text-foreground font-medium">
            {label}
          </Label>
        )}
        <Textarea
          ref={ref}
          className={textareaClasses}
          {...props}
        />
        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}
      </div>
    );
  }
);

ThemedTextarea.displayName = 'ThemedTextarea';