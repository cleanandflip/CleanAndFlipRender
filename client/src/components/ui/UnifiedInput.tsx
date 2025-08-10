import React from 'react';
import { cn } from '@/lib/utils';
import { HEIGHTS, FORMS } from '@/config/dimensions';

interface UnifiedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const UnifiedInput: React.FC<UnifiedInputProps> = ({
  label,
  error,
  helperText,
  required,
  icon,
  iconPosition = 'left',
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = cn(
    // Standard height for ALL text inputs
    HEIGHTS.input,
    'px-3 text-base border rounded-lg transition-colors',
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
    {
      'border-red-500 focus:ring-red-500 focus:border-red-500': error,
      'pl-10': icon && iconPosition === 'left',
      'pr-10': icon && iconPosition === 'right',
    },
    className
  );

  return (
    <div className={FORMS.fieldSpacing}>
      {label && (
        <label 
          htmlFor={inputId}
          className={cn('block text-sm font-medium', FORMS.labelMargin)}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-5 h-5'
            })}
          </div>
        )}
        
        <input
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-5 h-5'
            })}
          </div>
        )}
      </div>
      
      {error && (
        <p className={cn('text-sm text-red-600', FORMS.errorMargin)}>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className={cn('text-sm text-gray-500', FORMS.errorMargin)}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default UnifiedInput;