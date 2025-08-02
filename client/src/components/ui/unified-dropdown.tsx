import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface UnifiedDropdownProps {
  options: DropdownOption[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  allowCustom?: boolean;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function UnifiedDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchable = false,
  allowCustom = false,
  label,
  required = false,
  className = "",
  disabled = false
}: UnifiedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options to DropdownOption format
  const normalizedOptions: DropdownOption[] = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Filter options based on search
  const filteredOptions = searchable && search
    ? normalizedOptions.filter(opt => 
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : normalizedOptions;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search when value changes externally
  useEffect(() => {
    if (!searchable) return;
    const selectedOption = normalizedOptions.find(opt => opt.value === value);
    if (selectedOption && !isOpen) {
      setSearch(selectedOption.label);
    }
  }, [value, normalizedOptions, searchable, isOpen]);

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 bg-input backdrop-blur-sm border border-input rounded-lg text-left text-input-foreground transition-all duration-200 focus:outline-none flex items-center justify-between group",
          disabled 
            ? "cursor-not-allowed opacity-50" 
            : "hover:border-gray-600 focus:border-gray-500 cursor-pointer"
        )}
      >
        {searchable && isOpen ? (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="bg-transparent outline-none flex-1 placeholder:text-placeholder-color text-input-foreground"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className={selectedOption ? 'text-input-foreground' : 'text-gray-500'}>
            {selectedOption?.label || placeholder}
          </span>
        )}
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180",
            !disabled && "group-hover:text-white"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute z-[9999] w-full mt-2 py-1 bg-popover backdrop-blur-md border border-input rounded-lg shadow-2xl max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    if (searchable) {
                      setSearch(option.label);
                    }
                  }}
                  disabled={option.disabled}
                  className={cn(
                    "w-full px-4 py-3 text-left flex items-center justify-between transition-all duration-150",
                    option.disabled 
                      ? 'text-gray-500 cursor-not-allowed' 
                      : 'text-white hover:bg-gray-700/50 hover:text-input-foreground cursor-pointer',
                    option.value === value && 'bg-gray-700/30 text-input-foreground'
                  )}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-center">
                {allowCustom && search.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(search.trim());
                      setIsOpen(false);
                    }}
                    className="text-slate-300 hover:text-input-foreground transition-colors"
                  >
                    Use "{search.trim()}" (custom)
                  </button>
                ) : (
                  <span className="text-gray-500">No options found</span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}