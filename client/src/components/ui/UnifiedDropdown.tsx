// UNIFIED DROPDOWN FOR ALL REGULAR SELECTS
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  buttonClassName?: string;
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
  buttonClassName = ""
}: UnifiedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Normalize options
  const normalizedOptions: DropdownOption[] = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Get selected option(s)
  const selectedValues = Array.isArray(value) ? value : [value].filter(Boolean);
  const selectedOptions = normalizedOptions.filter(opt => 
    selectedValues.includes(opt.value)
  );

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  };

  const displayText = multiple
    ? selectedOptions.length > 0 
      ? `${selectedOptions.length} selected`
      : placeholder
    : selectedOptions[0]?.label || placeholder;

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-2.5 rounded-lg",
          "bg-gray-800/50 border border-gray-700",
          "text-left text-white",
          "flex items-center justify-between",
          "transition-all duration-200",
          !disabled && "hover:bg-gray-800/70 hover:border-gray-600",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-blue-500/50 border-blue-500/50",
          error && "border-red-500",
          buttonClassName
        )}
      >
        <span className={cn(
          "truncate",
          !selectedOptions.length && "text-gray-400"
        )}>
          {displayText}
        </span>
        
        <div className="flex items-center gap-2 ml-2">
          {clearable && selectedValues.length > 0 && !disabled && (
            <X 
              className="w-4 h-4 text-gray-400 hover:text-white"
              onClick={handleClear}
            />
          )}
          <ChevronDown className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className={cn(
          "absolute z-50 w-full mt-2",
          "bg-gray-800 border border-gray-700 rounded-lg",
          "shadow-xl max-h-64 overflow-auto",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}>
          {normalizedOptions.length === 0 ? (
            <div className="px-4 py-3 text-gray-400 text-center">
              No options available
            </div>
          ) : (
            normalizedOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                className={cn(
                  "w-full px-4 py-2.5 text-left",
                  "flex items-center justify-between",
                  "transition-colors duration-150",
                  "text-white",
                  !option.disabled && "hover:bg-gray-700/50",
                  option.disabled && "opacity-50 cursor-not-allowed",
                  selectedValues.includes(option.value) && "bg-gray-700/30"
                )}
              >
                <div className="flex items-center gap-3">
                  {option.icon && <span className="w-5 h-5">{option.icon}</span>}
                  <span>{option.label}</span>
                </div>
                {selectedValues.includes(option.value) && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}