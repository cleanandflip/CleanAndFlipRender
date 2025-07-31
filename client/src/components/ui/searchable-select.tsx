import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  options: string[];
  placeholder?: string;
  value?: string;
  onSelect: (value: string) => void;
  allowCustom?: boolean;
  className?: string;
}

export function SearchableSelect({ 
  options, 
  placeholder = "Search or select...", 
  value = "",
  onSelect, 
  allowCustom = true,
  className 
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (selectedValue: string) => {
    setSearch(selectedValue);
    setIsOpen(false);
    onSelect(selectedValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setIsOpen(true);
    if (allowCustom) {
      onSelect(e.target.value);
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-3 pr-10 py-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition-colors"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>
      </div>

      {isOpen && (
        <>
          {/* Backdrop for better focus */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown with improved visibility */}
          <div className="absolute z-[9999] w-full mt-1 bg-gray-900 border-2 border-gray-500 rounded-md shadow-2xl max-h-60 overflow-auto brand-dropdown">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full px-4 py-3 text-left text-gray-100 hover:bg-accent-blue hover:text-white transition-all duration-150 border-b border-gray-700 last:border-b-0 flex items-center justify-between",
                    search === option && "bg-accent-blue/30 text-white"
                  )}
                >
                  <span>{option}</span>
                  {search === option && <Check className="w-4 h-4 text-accent-blue" />}
                </button>
              ))
            ) : (
              <>
                {allowCustom && search.trim() ? (
                  <button
                    type="button"
                    onClick={() => handleSelect(search)}
                    className="w-full px-4 py-3 text-left text-accent-blue hover:bg-accent-blue hover:text-white transition-all duration-150"
                  >
                    Use "{search}" (custom brand)
                  </button>
                ) : (
                  <div className="px-4 py-3 text-gray-400 text-center">No brands found</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}