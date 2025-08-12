import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Search, X } from 'lucide-react';
import { getQueryFromURL, setQueryInURL, subscribeToQuery } from '@/lib/searchService';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBar({
  className = '',
  placeholder = "Search equipment...",
  autoFocus = false,
  size = 'md',
  id,
  onSearch
}: SearchBarProps) {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // Size variants
  const sizeClasses = {
    sm: 'pl-8 pr-16 py-2 text-sm',
    md: 'pl-10 pr-20 py-3 text-base',
    lg: 'pl-12 pr-24 py-4 text-lg'
  };
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  // Initialize and sync with URL
  useEffect(() => {
    const query = getQueryFromURL();
    setSearchQuery(query.q);
  }, []);

  // Subscribe to URL changes (back/forward navigation)
  useEffect(() => {
    const unsubscribe = subscribeToQuery((query) => {
      setSearchQuery(query.q);
    });
    return unsubscribe;
  }, []);

  // Debounced URL update
  const debouncedUpdateURL = useCallback((value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    setIsLoading(true);
    
    debounceRef.current = setTimeout(() => {
      const currentQuery = getQueryFromURL();
      
      // Only update if on products page or navigate there
      if (!location.startsWith('/products')) {
        setLocation('/products' + (value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ''));
      } else {
        setQueryInURL({ q: value.trim() });
      }
      
      setIsLoading(false);
      
      if (onSearch) {
        onSearch(value.trim());
      }
    }, 300);
  }, [location, setLocation, onSearch]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedUpdateURL(value);
  };

  // Handle form submission (immediate)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    const currentQuery = getQueryFromURL();
    if (!location.startsWith('/products')) {
      setLocation('/products' + (searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : ''));
    } else {
      setQueryInURL({ q: searchQuery.trim() }, { replace: false });
    }
    
    if (onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  // Handle clear
  const handleClear = () => {
    setSearchQuery('');
    setQueryInURL({ q: '' });
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (searchQuery) {
        handleClear();
      } else {
        inputRef.current?.blur();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Search 
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${
            isLoading ? 'animate-pulse' : ''
          }`}
          size={iconSizes[size]}
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          data-search-input
          disabled={isLoading}
          className={`
            w-full rounded-lg border border-gray-300 dark:border-gray-600 
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 
            disabled:opacity-50 disabled:cursor-not-allowed
            ${sizeClasses[size]} ${className}
          `}
          aria-label="Search products"
          aria-describedby={searchQuery ? `${id}-clear` : undefined}
        />
        
        {searchQuery && (
          <button
            type="button"
            id={`${id}-clear`}
            onClick={handleClear}
            disabled={isLoading}
            className={`
              absolute top-1/2 transform -translate-y-1/2 p-1 rounded-full
              text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${size === 'sm' ? 'right-12' : size === 'lg' ? 'right-16' : 'right-14'}
            `}
            aria-label="Clear search"
          >
            <X size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />
          </button>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className={`
            absolute top-1/2 transform -translate-y-1/2 
            px-2 py-1 rounded bg-blue-500 text-white text-sm 
            hover:bg-blue-600 disabled:bg-blue-400
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300
            disabled:cursor-not-allowed right-2
            ${size === 'sm' ? 'text-xs px-1.5' : size === 'lg' ? 'text-base px-3 py-2' : ''}
          `}
          aria-label="Submit search"
        >
          {isLoading ? '...' : 'Search'}
        </button>
        
        {/* Global shortcut hint */}
        <div className="sr-only">
          Press / to focus search
        </div>
      </div>
    </form>
  );
}