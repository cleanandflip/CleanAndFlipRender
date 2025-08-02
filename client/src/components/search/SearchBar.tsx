import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, X, Clock, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchResult, SearchSuggestion } from '@shared/types/search';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import SearchDropdown from './SearchDropdown';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  onResultClick?: (result: SearchResult) => void;
  variant?: 'default' | 'hero' | 'navbar';
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({
  className,
  placeholder = "Search equipment...",
  onSearch,
  onResultClick,
  variant = 'default',
  showSuggestions = true,
  autoFocus = false
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  
  const debouncedQuery = useDebounce(query, 300);

  // Fetch search results
  const { data: searchData, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return null;
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: debouncedQuery.length >= 2 && isOpen,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch popular searches
  const { data: popularData } = useQuery({
    queryKey: ['search-popular'],
    queryFn: async () => {
      const response = await fetch('/api/search/popular');
      if (!response.ok) throw new Error('Failed to fetch popular searches');
      return response.json();
    },
    staleTime: 3600000, // Cache for 1 hour
  });

  // Load recent searches from localStorage
  const getRecentSearches = useCallback(() => {
    try {
      const saved = localStorage.getItem('cleanflip-recent-searches');
      return saved ? JSON.parse(saved).slice(0, 5) : [];
    } catch {
      return [];
    }
  }, []);

  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);

  // Save search to history
  const saveToHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('cleanflip-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Handle search submission
  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    saveToHistory(searchQuery);
    onSearch?.(searchQuery);
    setIsOpen(false);
    inputRef.current?.blur();
  }, [saveToHistory, onSearch]);

  // Handle result click
  const handleResultClick = useCallback((result: SearchResult) => {
    saveToHistory(result.title);
    
    if (onResultClick) {
      onResultClick(result);
    } else {
      // Default navigation behavior
      setLocation(result.url);
    }
    
    setQuery('');
    setIsOpen(false);
  }, [saveToHistory, onResultClick, setLocation]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  }, [query, handleSearch]);

  // Clear search
  const handleClear = useCallback(() => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  // Click outside handler
  useClickOutside(containerRef, () => setIsOpen(false));

  // Prepare items for keyboard navigation
  const allItems = [
    ...(searchData?.results || []),
    ...(recentSearches.map(term => ({ type: 'recent', title: term }))),
    ...(popularData?.searches?.map(term => ({ type: 'popular', title: term })) || [])
  ];

  // Keyboard navigation
  useKeyboardNavigation({
    isOpen,
    items: allItems,
    selectedIndex,
    onSelect: (index) => setSelectedIndex(index),
    onEnter: (item) => {
      if (item.type === 'recent' || item.type === 'popular') {
        handleSearch(item.title);
      } else {
        handleResultClick(item as SearchResult);
      }
    },
    onEscape: () => setIsOpen(false)
  });

  // Auto-focus on mount if specified
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "search-container relative w-full",
        className
      )}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          "search-input-wrapper relative flex items-center",
          "bg-card/80 backdrop-blur-sm border border-white/10",
          "rounded-xl transition-all duration-200",
          "hover:bg-card/90 hover:border-white/20",
          "focus-within:bg-card/95 focus-within:border-primary/50",
          "focus-within:ring-2 focus-within:ring-primary/20",
          {
            'h-12 px-4': variant === 'default',
            'h-14 px-5': variant === 'hero',
            'h-10 px-3': variant === 'navbar'
          }
        )}>
          {/* Search Icon */}
          <Search className={cn(
            "text-muted-foreground mr-3 flex-shrink-0",
            {
              'w-5 h-5': variant === 'default',
              'w-6 h-6': variant === 'hero',
              'w-4 h-4': variant === 'navbar'
            }
          )} />
          
          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={cn(
              "flex-1 bg-transparent border-0 outline-none",
              "text-foreground placeholder:text-muted-foreground",
              "focus:ring-0 focus:outline-none",
              {
                'text-base': variant === 'default',
                'text-lg': variant === 'hero',
                'text-sm': variant === 'navbar'
              }
            )}
            autoComplete="off"
            spellCheck="false"
          />
          
          {/* Loading Indicator */}
          {isLoading && !query && (
            <div className="mr-2">
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            </div>
          )}
          
          {/* Clear Button */}
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Search Dropdown */}
      <AnimatePresence>
        {isOpen && showSuggestions && (
          <SearchDropdown
            query={query}
            results={searchData?.results || []}
            suggestions={searchData?.suggestions || []}
            recentSearches={recentSearches}
            popularSearches={popularData?.searches || []}
            isLoading={isLoading}
            selectedIndex={selectedIndex}
            onResultClick={handleResultClick}
            onSearchClick={handleSearch}
            onClearHistory={() => {
              setRecentSearches([]);
              localStorage.removeItem('cleanflip-recent-searches');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}