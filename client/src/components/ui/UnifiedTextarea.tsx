/**
 * UNIFIED TEXTAREA COMPONENT - PHASE 5: INPUT FIELD UNIFICATION
 * Standardized textarea component following design system specifications
 * August 10, 2025 - Professional UI Modernization
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { INPUTS } from '@/config/dimensions';

interface UnifiedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  variant?: 'default' | 'ghost' | 'filled';
  minRows?: number;
}

export const UnifiedTextarea = React.forwardRef<HTMLTextAreaElement, UnifiedTextareaProps>(({
  label,
  error,
  helperText,
  required = false,
  variant = 'default',
  minRows = 3,
  className,
  id,
  ...props
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const getTextareaClasses = () => {
    const baseClasses = 'w-full p-3 text-base border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical';
    
    // Height specification: ALL textareas MUST have min-h-[80px]
    const heightClass = 'min-h-[80px]'; // INPUTS.textarea.minHeight enforcement
    
    const variantClasses = {
      default: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500',
      ghost: 'border-transparent bg-gray-50 dark:bg-gray-700 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800',
      filled: 'border-gray-200 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800'
    };

    const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';

    return cn(
      baseClasses,
      heightClass,
      variantClasses[variant],
      errorClasses,
      className
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        rows={minRows}
        className={getTextareaClasses()}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
});

UnifiedTextarea.displayName = "UnifiedTextarea";

export default UnifiedTextarea;