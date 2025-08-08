import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isReady, setIsReady] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalRoot = typeof document !== 'undefined' ? document.body : null;

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

  // Portal readiness
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      let left = rect.left + scrollX;
      const width = Math.max(rect.width, 200);
      
      // Ensure dropdown doesn't go off-screen
      const windowWidth = window.innerWidth;
      if (left + width > windowWidth) {
        left = windowWidth - width - 10;
      }
      if (left < 10) {
        left = 10;
      }

      setDropdownPosition({
        top: rect.bottom + scrollY + 8,
        left,
        width
      });
    }
  }, [isOpen]);

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  // Initialize search with current value
  useEffect(() => {
    if (!searchable) return;
    if (selectedOption) {
      setSearch(selectedOption.label);
    } else if (value) {
      // Handle custom values that aren't in options
      setSearch(value);
    } else {
      setSearch('');
    }
  }, [value, selectedOption, searchable]);

  // Handle Enter key to save custom values
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchable && allowCustom && search.trim()) {
      e.preventDefault();
      onChange(search.trim());
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  // Click outside and escape handling
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
        setSelectedIndex(-1);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Remove debug logs for production

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div
        ref={triggerRef}
        onClick={() => {
          if (!disabled && !searchable) {
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "w-full px-4 py-3 rounded-lg text-left transition-all duration-200 flex items-center justify-between group",
          "hover:bg-white/10",
          disabled 
            ? "cursor-not-allowed opacity-50" 
            : searchable ? "cursor-text" : "cursor-pointer"
        )}
        style={{
          background: 'rgba(75, 85, 99, 0.4)',
          border: '1px solid rgba(156, 163, 175, 0.4)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          fontWeight: '500'
        }}
      >
        {searchable ? (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="bg-transparent border-none outline-none flex-1 placeholder:text-gray-400 text-white w-full focus:ring-0"
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              // If allowCustom and we have a search value, use it
              if (allowCustom && search.trim() && !normalizedOptions.find(opt => opt.label === search.trim())) {
                onChange(search.trim());
              }
            }}
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
      </div>

      {/* Safe Portal Dropdown with GlobalDropdown Theme */}
      {isReady && portalRoot && createPortal(
        <AnimatePresence>
          {isOpen && !disabled && (
            <>
              {/* Backdrop */}
              <motion.div 
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20" 
                style={{ zIndex: 999998 }}
                onClick={() => {
                  setIsOpen(false);
                  setSelectedIndex(-1);
                }}
              />
              
              {/* Dropdown Content */}
              <motion.div 
                key="dropdown"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                ref={dropdownRef}
                className="rounded-lg overflow-hidden max-h-96 overflow-y-auto scrollbar-hide"
                style={{
                  position: 'fixed',
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  zIndex: 999999,
                  background: 'rgba(75, 85, 99, 0.4)',
                  border: '1px solid rgba(156, 163, 175, 0.4)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              >
                {/* Show custom option first if applicable */}
                {allowCustom && search.trim() && !normalizedOptions.find(opt => opt.label.toLowerCase() === search.trim().toLowerCase()) && (
                  <div
                    onClick={() => {
                      onChange(search.trim());
                      setIsOpen(false);
                      setSelectedIndex(-1);
                    }}
                    className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors duration-150 border-b border-gray-600/50"
                  >
                    <span className="font-medium text-blue-300 flex items-center gap-2">
                      <span>Create "{search.trim()}"</span>
                      <span className="text-xs bg-blue-500/20 px-2 py-1 rounded">Custom</span>
                    </span>
                  </div>
                )}
                
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => (
                    <div key={option.value}>
                      <div
                        onClick={() => {
                          if (!option.disabled) {
                            onChange(option.value);
                            setIsOpen(false);
                            if (searchable) {
                              setSearch(option.label);
                            }
                            setSelectedIndex(-1);
                          }
                        }}
                        className={cn(
                          "px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors duration-150 flex items-center justify-between",
                          option.disabled && 'opacity-50 cursor-not-allowed',
                          option.value === value && 'bg-white/10'
                        )}
                      >
                        <span className="font-medium truncate flex-1 pr-2">{option.label}</span>
                        {option.value === value && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      {index < filteredOptions.length - 1 && (
                        <div className="border-t mx-4" style={{ borderColor: '#4B5563' }} />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-white font-medium text-center">
                    {allowCustom ? 'Type to create custom option' : 'No options found'}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        portalRoot
      )}
    </div>
  );
}