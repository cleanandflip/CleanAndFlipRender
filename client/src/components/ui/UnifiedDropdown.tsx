// UNIFIED DROPDOWN MATCHING YOUR EXACT THEME
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
// Removed problematic theme import causing transition errors

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface UnifiedDropdownProps {
  options: DropdownOption[] | string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  className?: string;
  variant?: 'default' | 'ghost' | 'nav';
}

export function UnifiedDropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  error,
  disabled = false,
  required = false,
  clearable = false,
  multiple = false,
  className = "",
  variant = 'default'
}: UnifiedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options with null check
  const normalizedOptions: DropdownOption[] = (options || []).map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedValues = Array.isArray(value) ? value : [value].filter(Boolean);
  const selectedOptions = normalizedOptions.filter(opt => 
    selectedValues.includes(opt.value)
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setIsOpen(false);
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return;

    if (multiple) {
      const newValues = selectedValues.includes(option.value)
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];
      onChange(newValues);
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  // Style variants using Tailwind classes - UNIFIED with Input/Textarea styling

  const buttonClasses = cn(
    'w-full h-10 px-3 text-base border rounded-lg transition-colors',
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
    'flex items-center justify-between',
    isOpen && 'border-blue-500 ring-2 ring-blue-500/20',
    variant === 'ghost' && 'bg-transparent border-transparent',
    variant === 'nav' && 'bg-transparent border-gray-600'
  );

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={buttonClasses}
      >
        <span 
          className={cn("truncate text-white", selectedOptions.length && "text-white")}
        >
          {multiple
            ? selectedOptions.length > 0 
              ? `${selectedOptions.length} selected`
              : placeholder
            : selectedOptions[0]?.label || placeholder}
        </span>
        
        <div className="flex items-center gap-2 ml-2">
          {clearable && selectedValues.length > 0 && !disabled && (
            <X 
              className="w-4 h-4 opacity-60 hover:opacity-100 transition-opacity text-gray-400"
              onClick={(e) => {
                e.stopPropagation();
                onChange(multiple ? [] : '');
              }}
            />
          )}
          <ChevronDown 
            className={cn("w-4 h-4 transition-transform text-gray-400", isOpen && "rotate-180")}
          />
        </div>
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div 
          className="absolute z-50 w-full mt-2 rounded-lg shadow-xl dropdown-scrollable overflow-hidden bg-gray-800 border border-gray-600 backdrop-blur-lg animate-in slide-in-from-top-1 duration-200"
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-4 py-3 text-center text-gray-400">
              No options available
            </div>
          ) : (
            normalizedOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-white border-gray-600",
                  "flex items-center justify-between",
                  "transition-colors duration-150",
                  !option.disabled && "hover:bg-white hover:bg-opacity-5",
                  option.disabled && "opacity-50 cursor-not-allowed",
                  index !== 0 && "border-t",
                  selectedValues.includes(option.value) && "bg-blue-500/20"
                )}
              >
                <div className="flex items-center gap-3">
                  {option.icon && <span className="w-5 h-5">{option.icon}</span>}
                  <span>{option.label}</span>
                </div>
                {selectedValues.includes(option.value) && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Export aliases for backward compatibility
export const StandardDropdown = UnifiedDropdown;
export const NavDropdown = (props: UnifiedDropdownProps) => (
  <UnifiedDropdown {...props} variant="nav" />
);
export const GhostDropdown = (props: UnifiedDropdownProps) => (
  <UnifiedDropdown {...props} variant="ghost" />
);