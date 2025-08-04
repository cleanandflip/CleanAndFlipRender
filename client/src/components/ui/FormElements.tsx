import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Input Component
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  success?: boolean;
}>(({ className, error, success, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'field',
        error && 'field-error',
        success && 'field-success',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

// Select Component
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
}>(({ className, error, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'field select-field',
        error && 'field-error',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

// Textarea Component
export const Textarea = forwardRef<HTMLTextAreaElement, InputHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
}>(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'field',
        error && 'field-error',
        'resize-none',
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

// Form Group Component
export const FormGroup = ({ 
  label, 
  hint, 
  error, 
  children, 
  required 
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) => {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

// Filter Button Component
export const FilterButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  count?: number;
}>(({ className, active, count, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'filter-btn',
        active && 'active',
        className
      )}
      {...props}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
          {count}
        </span>
      )}
    </button>
  );
});
FilterButton.displayName = "FilterButton";

// Checkbox Component
export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
}>(({ className, label, ...props }, ref) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        ref={ref}
        type="checkbox"
        className={cn('checkbox', className)}
        {...props}
      />
      {label && <span className="text-secondary">{label}</span>}
    </label>
  );
});
Checkbox.displayName = "Checkbox";

// Switch Component
export const Switch = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
}>(({ className, label, checked, ...props }, ref) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className={cn('switch', checked && 'checked', className)}>
        <div className="switch-thumb" />
        <input
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={checked}
          {...props}
        />
      </div>
      {label && <span className="text-secondary">{label}</span>}
    </label>
  );
});
Switch.displayName = "Switch";