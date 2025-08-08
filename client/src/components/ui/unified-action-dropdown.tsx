import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionDropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

interface UnifiedActionDropdownProps {
  options: ActionDropdownOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  trigger?: React.ReactNode;
  placeholder?: string;
  className?: string;
  align?: 'start' | 'center' | 'end';
  closeOnSelect?: boolean;
  disabled?: boolean;
}

export function UnifiedActionDropdown({
  options,
  value,
  onValueChange,
  trigger,
  placeholder = 'Select option',
  className = '',
  align = 'start',
  closeOnSelect = true,
  disabled = false
}: UnifiedActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle option selection
  const handleSelect = (option: ActionDropdownOption) => {
    if (option.disabled) return;
    
    if (option.onClick) {
      option.onClick();
    }
    
    if (onValueChange) {
      onValueChange(option.value);
    }
    
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Get selected option for display
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  // Default trigger if none provided
  const defaultTrigger = (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={cn(
        "flex items-center justify-between gap-2 px-4 py-3 rounded-lg",
        "bg-bg-secondary/50 border border-bg-secondary-border",
        "text-text-primary hover:bg-bg-secondary/70",
        "focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue",
        "transition-all duration-200",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="flex items-center gap-2">
        {selectedOption?.icon}
        {displayLabel}
      </span>
      <ChevronDown 
        size={16} 
        className={cn(
          "transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );

  // Action trigger (like a three-dot menu)
  const actionTrigger = (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={cn(
        "p-2 rounded-lg",
        "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50",
        "focus:outline-none focus:ring-2 focus:ring-accent-blue",
        "transition-all duration-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <MoreVertical size={16} />
    </button>
  );

  const renderTrigger = () => {
    if (trigger) {
      return React.cloneElement(trigger as React.ReactElement, {
        onClick: () => setIsOpen(!isOpen),
        onKeyDown: handleKeyDown,
        disabled
      });
    }
    
    // Use action trigger if no specific value is being tracked
    return value !== undefined ? defaultTrigger : actionTrigger;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {renderTrigger()}

      {/* Dropdown content */}
      {isOpen && (
        <div className={cn(
          "absolute top-full mt-2 z-50 min-w-48",
          "bg-bg-secondary border border-bg-secondary-border rounded-lg shadow-lg",
          "py-1",
          align === 'end' && "right-0",
          align === 'center' && "left-1/2 transform -translate-x-1/2"
        )}>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option)}
              disabled={option.disabled}
              className={cn(
                "w-full px-4 py-3 text-left flex items-center gap-3",
                "hover:bg-bg-primary/20 transition-colors",
                "text-text-primary",
                option.variant === 'destructive' && "text-red-400 hover:text-red-300",
                option.disabled && "opacity-50 cursor-not-allowed",
                option.value === value && "bg-accent-blue/10 text-accent-blue"
              )}
            >
              {option.icon && (
                <span className={cn(
                  "flex-shrink-0",
                  option.variant === 'destructive' ? "text-red-400" : "text-text-secondary"
                )}>
                  {option.icon}
                </span>
              )}
              <span className="flex-1">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}