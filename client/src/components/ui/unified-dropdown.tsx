import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      setDropdownPosition({
        top: rect.bottom + scrollY + 8,
        left: rect.left + scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setSelectedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
            onChange(filteredOptions[selectedIndex].value);
            setIsOpen(false);
            if (searchable) {
              setSearch(filteredOptions[selectedIndex].label);
            }
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setSearch('');
          setSelectedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, selectedIndex, filteredOptions, onChange, searchable]);

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
    <div className={cn("relative w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Dropdown Trigger - Glass morphism styling matching UnifiedSearchBar */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
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

      {/* Dropdown Menu with Portal - Glass morphism styling */}
      <AnimatePresence>
        {isOpen && !disabled && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[999999]"
          >
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20" 
              onClick={() => {
                setIsOpen(false);
                setSearch('');
                setSelectedIndex(-1);
              }}
            />
            
            {/* Menu with glass morphism */}
            <motion.div 
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="py-1 rounded-lg shadow-2xl max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                background: 'rgba(75, 85, 99, 0.4)',
                border: '1px solid rgba(156, 163, 175, 0.4)',
                backdropFilter: 'blur(8px)',
                zIndex: 999999,
                minWidth: '200px'
              }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
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
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}