import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Base types
interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
  meta?: string;
}

interface BaseDropdownProps {
  options: DropdownOption[] | string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

// VARIATION 1: Standard Dropdown with Search
interface StandardDropdownProps extends BaseDropdownProps {
  variant?: 'standard';
  searchable?: boolean;
  allowCustom?: boolean;
  multiSelect?: boolean;
  clearable?: boolean;
}

export function StandardDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchable = false,
  allowCustom = false,
  multiSelect = false,
  clearable = false,
  label,
  required = false,
  className = "",
  disabled = false,
  error,
  size = 'md'
}: StandardDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options
  const normalizedOptions: DropdownOption[] = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Filter options
  const filteredOptions = searchable && search
    ? normalizedOptions.filter(opt => 
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.description?.toLowerCase().includes(search.toLowerCase())
      )
    : normalizedOptions;

  // Handle multi-select values
  const selectedValues = Array.isArray(value) ? value : [value];
  const selectedOptions = normalizedOptions.filter(opt => 
    selectedValues.includes(opt.value)
  );

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  // Position calculation
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 400; // Max height
      
      let top = rect.bottom + scrollY + 8;
      
      // If dropdown would go below viewport, position above
      if (rect.bottom + dropdownHeight > viewportHeight) {
        top = rect.top + scrollY - dropdownHeight - 8;
      }
      
      setDropdownPosition({
        top,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        dropdownRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return;

    if (multiSelect) {
      const newValues = selectedValues.includes(option.value)
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];
      onChange(newValues);
    } else {
      onChange(option.value);
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiSelect ? [] : '');
  };

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full rounded-lg text-left transition-all duration-200 flex items-center justify-between group",
          "hover:bg-white/10",
          sizeClasses[size],
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          error && "border-red-500"
        )}
        style={{
          background: 'rgba(75, 85, 99, 0.4)',
          border: '1px solid rgba(156, 163, 175, 0.4)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          fontWeight: '500'
        }}
      >
        <span className={selectedOptions.length > 0 ? 'text-white' : 'text-gray-400'}>
          {multiSelect 
            ? selectedOptions.length > 0 
              ? `${selectedOptions.length} selected`
              : placeholder
            : selectedOptions[0]?.label || placeholder
          }
        </span>
        
        <div className="flex items-center gap-2">
          {clearable && selectedValues.length > 0 && !disabled && (
            <X 
              className="w-4 h-4 text-gray-400 hover:text-white"
              onClick={handleClear}
            />
          )}
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Portal Dropdown */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && !disabled && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-[999998]"
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div 
                ref={dropdownRef}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-lg overflow-hidden max-h-96 z-[999999]"
                style={{
                  position: 'fixed',
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  background: 'rgba(31, 41, 55, 0.95)',
                  border: '1px solid rgba(156, 163, 175, 0.4)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
              >
                {searchable && (
                  <div className="p-3 border-b border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 bg-white/10 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {allowCustom && search && !normalizedOptions.find(opt => opt.label === search) && (
                  <div
                    onClick={() => {
                      onChange(search);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer border-b border-gray-700"
                  >
                    <span className="text-blue-400">Create "{search}"</span>
                  </div>
                )}

                <div className="overflow-y-auto max-h-64 scrollbar-hide">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map(option => (
                      <div
                        key={option.value}
                        onClick={() => handleSelect(option)}
                        className={cn(
                          "px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between",
                          option.disabled && "opacity-50 cursor-not-allowed",
                          selectedValues.includes(option.value) && "bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {option.icon && <span>{option.icon}</span>}
                          <div>
                            <div className="font-medium">{option.label}</div>
                            {option.description && (
                              <div className="text-sm text-gray-400">{option.description}</div>
                            )}
                          </div>
                        </div>
                        {selectedValues.includes(option.value) && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-400">
                      No options found
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export type { DropdownOption };