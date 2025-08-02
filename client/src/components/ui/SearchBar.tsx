import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  recentSearches?: string[];
  onSearch?: (value: string) => void;
}

export function SearchBar({ 
  value = '', 
  onChange, 
  placeholder = 'Search equipment...',
  recentSearches = [],
  onSearch 
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0
  });

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const handleSearch = (searchTerm: string) => {
    setInputValue(searchTerm);
    onChange?.(searchTerm);
    onSearch?.(searchTerm);
    setIsOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(inputValue);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Render dropdown in portal to ensure it's on top
  const dropdown = isOpen && typeof document !== 'undefined' && createPortal(
    <div 
      className="search-dropdown-portal"
      style={{
        position: 'fixed',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        zIndex: 999999,
      }}
    >
      <div className="search-dropdown-content">
        {recentSearches.length > 0 && (
          <div className="search-section">
            <div className="search-section-header">
              <Clock size={14} />
              <span>Recent Searches</span>
            </div>
            {recentSearches.map((search, idx) => (
              <button
                key={idx}
                type="button"
                className="search-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSearch(search);
                }}
              >
                <Clock size={14} />
                <span>{search}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Popular equipment searches */}
        <div className="search-section">
          <div className="search-section-header">
            <Search size={14} />
            <span>Popular Equipment</span>
          </div>
          {['Olympic Barbell', 'Weight Plates', 'Power Rack', 'Dumbbells', 'Kettlebells'].map((equipment, idx) => (
            <button
              key={idx}
              type="button"
              className="search-item"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSearch(equipment);
              }}
            >
              <Search size={14} />
              <span>{equipment}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="search-bar-container">
      <div className="search-input-wrapper">
        <Search className="search-icon" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
        />
        {inputValue && (
          <button
            type="button"
            className="search-clear"
            onMouseDown={(e) => {
              e.preventDefault();
              setInputValue('');
              onChange?.('');
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      {dropdown}
    </div>
  );
}