// UNIFIED DROPDOWN MATCHING YOUR EXACT THEME
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLEANFLIP_THEME as theme } from '@/constants/theme';

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

  // Style variants matching your theme
  const buttonStyles = {
    default: cn(
      "w-full px-4 py-2.5 rounded-lg",
      "text-left flex items-center justify-between",
      "transition-all duration-200",
      "border",
      !disabled && "hover:border-opacity-60",
      disabled && "opacity-50 cursor-not-allowed",
      isOpen && "ring-2 ring-opacity-40",
      error && "border-red-500"
    ),
    ghost: cn(
      "px-3 py-2 rounded-lg",
      "text-left flex items-center gap-2",
      "transition-all duration-200",
      !disabled && "hover:bg-white hover:bg-opacity-10",
      disabled && "opacity-50 cursor-not-allowed"
    ),
    nav: cn(
      "flex items-center gap-2 px-3 py-2",
      "rounded-lg transition-all duration-200",
      !disabled && "hover:bg-white hover:bg-opacity-10",
      disabled && "opacity-50 cursor-not-allowed"
    )
  };

  const dropdownStyles = {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.border,
    backdropFilter: theme.effects.blur,
    color: theme.colors.textPrimary,
  };

  const buttonStyle = {
    backgroundColor: variant === 'ghost' || variant === 'nav' 
      ? 'transparent' 
      : theme.colors.inputBg,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    ...(isOpen && { 
      borderColor: theme.colors.accent,
      boxShadow: `0 0 0 3px ${theme.colors.accentFocus}`
    })
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {label && (
        <label 
          className="block text-sm font-medium mb-2"
          style={{ color: theme.colors.textSecondary }}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={buttonStyles[variant]}
        style={buttonStyle}
      >
        <span 
          className={cn("truncate", !selectedOptions.length && "opacity-60")}
          style={{ 
            color: selectedOptions.length 
              ? theme.colors.textPrimary 
              : theme.colors.textPlaceholder 
          }}
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
              className="w-4 h-4 opacity-60 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onChange(multiple ? [] : '');
              }}
              style={{ color: theme.colors.textSecondary }}
            />
          )}
          <ChevronDown 
            className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")}
            style={{ color: theme.colors.textSecondary }}
          />
        </div>
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div 
          className="absolute z-50 w-full mt-2 rounded-lg overflow-hidden shadow-xl max-h-64 overflow-auto"
          style={{
            ...dropdownStyles,
            boxShadow: theme.effects.shadow,
            animation: 'slideDown 0.2s ease-out'
          }}
        >
          {normalizedOptions.length === 0 ? (
            <div 
              className="px-4 py-3 text-center"
              style={{ color: theme.colors.textSecondary }}
            >
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
                  "w-full px-4 py-2.5 text-left",
                  "flex items-center justify-between",
                  "transition-colors duration-150",
                  !option.disabled && "hover:bg-white hover:bg-opacity-5",
                  option.disabled && "opacity-50 cursor-not-allowed",
                  index !== 0 && "border-t"
                )}
                style={{
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                  ...(selectedValues.includes(option.value) && {
                    backgroundColor: theme.colors.selected
                  })
                }}
              >
                <div className="flex items-center gap-3">
                  {option.icon && <span className="w-5 h-5">{option.icon}</span>}
                  <span>{option.label}</span>
                </div>
                {selectedValues.includes(option.value) && (
                  <Check 
                    className="w-4 h-4" 
                    style={{ color: theme.colors.accent }}
                  />
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