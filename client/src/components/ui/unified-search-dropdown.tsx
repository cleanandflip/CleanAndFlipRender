import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface UnifiedSearchDropdownProps {
  options?: DropdownOption[] | string[];
  value?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  searchable?: boolean;
  allowCustom?: boolean;
  disabled?: boolean;
}

export function UnifiedSearchDropdown({
  options = [],
  value = '',
  onValueChange,
  onSearch,
  placeholder = 'Search...',
  className = '',
  icon,
  searchable = true,
  allowCustom = false,
  disabled = false
}: UnifiedSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayValue, setDisplayValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize options to DropdownOption format
  const normalizedOptions: DropdownOption[] = options.map(option => 
    typeof option === 'string' 
      ? { value: option, label: option }
      : option
  );

  // Filter options based on search query
  const filteredOptions = searchable 
    ? normalizedOptions.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : normalizedOptions;

  // Handle selection
  const handleSelect = (selectedValue: string) => {
    setDisplayValue(selectedValue);
    onValueChange?.(selectedValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setDisplayValue(query);
    
    if (onSearch) {
      onSearch(query);
    }
    
    if (allowCustom && onValueChange) {
      onValueChange(query);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery && allowCustom) {
      handleSelect(searchQuery);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update display value when value prop changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Get display label for selected value
  const selectedOption = normalizedOptions.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || value;

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen && searchable ? searchQuery : displayLabel}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 pr-10 rounded-lg",
            "bg-bg-secondary/50 border border-bg-secondary-border",
            "text-text-primary placeholder:text-text-secondary",
            "focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue",
            "transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed",
            icon && "pl-10"
          )}
          readOnly={!searchable}
        />
        
        {/* Left icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
            {icon}
          </div>
        )}
        
        {/* Right chevron */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronDown 
            size={16} 
            className={cn(
              "transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
        
        {/* Clear button */}
        {(searchQuery || value) && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setDisplayValue('');
              onValueChange?.('');
              inputRef.current?.focus();
            }}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown content */}
      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-2 z-50",
          "bg-bg-secondary border border-bg-secondary-border rounded-lg shadow-lg",
          "max-h-60 overflow-y-auto"
        )}>
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-text-secondary text-sm text-center">
              {searchQuery && allowCustom 
                ? `Press Enter to add "${searchQuery}"`
                : 'No options found'
              }
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center gap-3",
                  "hover:bg-bg-primary/20 transition-colors",
                  "text-text-primary",
                  option.value === value && "bg-accent-blue/10 text-accent-blue"
                )}
              >
                {option.icon && (
                  <span className="text-text-secondary">
                    {option.icon}
                  </span>
                )}
                <span>{option.label}</span>
              </button>
            ))
          )}
          
          {/* Custom option */}
          {searchQuery && allowCustom && !filteredOptions.some(opt => opt.value === searchQuery) && (
            <button
              onClick={() => handleSelect(searchQuery)}
              className="w-full px-4 py-3 text-left border-t border-bg-secondary-border hover:bg-bg-primary/20 transition-colors text-text-primary"
            >
              Add "{searchQuery}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}