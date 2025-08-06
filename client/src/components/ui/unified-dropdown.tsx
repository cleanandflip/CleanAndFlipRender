import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  // Test dropdown is working
  console.log('UnifiedDropdown render:', { 
    isOpen, 
    disabled, 
    optionsLength: normalizedOptions.length,
    filteredOptionsLength: filteredOptions.length,
    dropdownPosition 
  });

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          console.log('Dropdown button clicked, current isOpen:', isOpen);
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 rounded-lg text-left transition-all duration-200 focus:outline-none flex items-center justify-between group",
          "hover:bg-white/10 focus:border-blue-500",
          disabled 
            ? "cursor-not-allowed opacity-50" 
            : "cursor-pointer"
        )}
        style={{
          background: 'rgba(75, 85, 99, 0.4)',
          border: '1px solid rgba(156, 163, 175, 0.4)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          fontWeight: '500'
        }}
      >
        {searchable && isOpen ? (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="bg-transparent outline-none flex-1 placeholder:text-gray-400 text-white"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
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

      {/* Simple dropdown without portal - testing */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 py-1 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
          style={{
            background: 'rgba(75, 85, 99, 0.9)',
            border: '2px solid rgba(156, 163, 175, 0.8)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  console.log('Option clicked:', option.value);
                  onChange(option.value);
                  setIsOpen(false);
                  if (searchable) {
                    setSearch(option.label);
                  }
                  setSelectedIndex(-1);
                }}
                disabled={option.disabled}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center justify-between transition-all duration-150",
                  option.disabled 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-white hover:bg-white/10 cursor-pointer',
                  option.value === value && 'bg-white/5 text-white',
                  selectedIndex === index && 'bg-white/10'
                )}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <Check className="w-4 h-4 text-gray-400" />
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
                    setSearch('');
                    setSelectedIndex(-1);
                  }}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Use "{search.trim()}" (custom)
                </button>
              ) : (
                <span className="text-gray-400">No options found</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            console.log('Outside click detected');
            setIsOpen(false);
            setSearch('');
            setSelectedIndex(-1);
          }} 
        />
      )}
    </div>
  );
}