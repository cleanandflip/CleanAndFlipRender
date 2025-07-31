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
          className="w-full pl-3 pr-10 py-2 glass border-glass-border text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
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
        <div className="absolute z-50 w-full mt-1 glass border-glass-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-white/10 text-white transition-colors flex items-center justify-between",
                  search === option && "bg-accent-blue/20"
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
                  className="w-full px-3 py-2 text-left hover:bg-white/10 text-accent-blue transition-colors"
                >
                  Use "{search}"
                </button>
              ) : (
                <div className="px-3 py-2 text-text-muted text-sm">No brands found</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}