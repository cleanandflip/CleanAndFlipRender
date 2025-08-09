// UNIFIED SEARCH MATCHING YOUR THEME
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocation } from 'wouter';
import { CLEANFLIP_THEME as theme } from '@/constants/theme';

export interface SearchResult {
  id: string;
  type: 'product' | 'category' | 'page';
  title: string;
  subtitle?: string;
  url: string;
  image?: string;
  price?: string;
}

interface UnifiedSearchProps {
  placeholder?: string;
  className?: string;
  showTrending?: boolean;
  showRecent?: boolean;
  apiEndpoint?: string;
  onSearch?: (query: string) => void;
  onSelect?: (result: SearchResult) => void;
  variant?: 'navbar' | 'page';
}

export function UnifiedSearch({
  placeholder = "Search equipment...",
  className = "",
  showTrending = true,
  showRecent = true,
  apiEndpoint = "/api/search",
  onSearch,
  onSelect,
  variant = 'navbar'
}: UnifiedSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const [, navigate] = useLocation();

  const trendingItems = ['Dumbbells', 'Bench Press', 'Protein', 'Yoga Mat'];

  // Load recent searches
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent).slice(0, 5));
    }
  }, []);

  // Fetch results
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setLoading(true);
      fetch(`${apiEndpoint}?q=${encodeURIComponent(debouncedQuery)}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || []);
          setLoading(false);
        })
        .catch(() => {
          setResults([]);
          setLoading(false);
        });
    } else {
      setResults([]);
    }
  }, [debouncedQuery, apiEndpoint]);

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,  // Remove window.scrollY for fixed positioning
        left: rect.left,   // Remove window.scrollX for fixed positioning
        width: rect.width
      });
    } else {
      setDropdownPosition(null); // Reset when closed to prevent animation from 0,0
    }
  }, [isOpen]);

  // Update position on scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom,  // Fixed positioning - no scroll offset needed
          left: rect.left,
          width: rect.width
        });
      }
    };

    if (isOpen) {
      // Update immediately
      updatePosition();
      
      // Then listen for changes
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition, { passive: true });
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      setQuery('');
      setResults([]);
      setIsOpen(false);
    };
  }, []);

  const handleSearch = useCallback((searchQuery: string) => {
    // Skip empty queries
    if (!searchQuery?.trim()) {
      return;
    }
    
    console.log('handleSearch called:', searchQuery, 'variant:', variant);
    
    // Save to recent searches
    const recent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(recent);
    localStorage.setItem('recentSearches', JSON.stringify(recent));
    
    // Set the query in input
    setQuery(searchQuery);
    
    // Navigate based on variant
    if (variant === 'navbar') {
      // From navbar: always go to products page with search
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    } else if (variant === 'page') {
      // From products page: trigger search callback
      if (onSearch) {
        onSearch(searchQuery);
      } else {
        // Update URL params without navigation
        const url = new URL(window.location.href);
        url.searchParams.set('search', searchQuery);
        window.history.pushState(null, '', url.toString());
      }
    }
    
    // Close dropdown and remove focus
    setIsOpen(false);
    inputRef.current?.blur();
  }, [recentSearches, onSearch, navigate, variant]);

  const handleResultClick = (result: SearchResult) => {
    if (onSelect) {
      onSelect(result);
    } else {
      navigate(result.url);
    }
    setIsOpen(false);
  };

  const handleTrendingClick = (item: string) => {
    console.log('🔥 TRENDING CLICK TRIGGERED:', item);
    console.log('Current variant:', variant);
    console.log('Current query state:', query);
    
    setQuery(item);
    setTimeout(() => {
      console.log('🚀 EXECUTING SEARCH FOR:', item);
      handleSearch(item);
    }, 50); // Increased timeout for better state sync
  };

  const searchStyles = {
    container: variant === 'navbar' 
      ? "relative max-w-md" 
      : "relative w-full max-w-2xl mx-auto",
    input: cn(
      "w-full pl-10 pr-10 py-2.5 rounded-lg",
      "transition-all duration-200",
      "border focus:outline-none focus:ring-2",
      variant === 'navbar' ? "text-sm" : "text-base"
    ),
    dropdown: "absolute z-50 w-full mt-2 rounded-lg overflow-hidden shadow-xl max-h-96 overflow-auto"
  };

  const inputStyle = {
    backgroundColor: theme.colors.inputBg,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    ...(isOpen && {
      borderColor: theme.colors.accent,
      boxShadow: `0 0 0 3px ${theme.colors.accentFocus}`
    })
  };

  const dropdownStyle = {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.border,
    backdropFilter: theme.effects.blur,
    boxShadow: theme.effects.shadow
  };

  return (
    <div className={cn(searchStyles.container, className)} ref={searchRef}>
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
          style={{ color: theme.colors.textSecondary }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            console.log('🎯 SEARCH INPUT FOCUSED - Opening dropdown');
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (query.trim()) {
                handleSearch(query);
              }
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={placeholder}
          className={searchStyles.input}
          style={inputStyle}
        />
        {query && (
          <button
            onClick={() => {
              // Clear query
              setQuery('');
              setResults([]);
              setIsOpen(false);
              
              if (variant === 'navbar') {
                // Navbar: go to home
                navigate('/');
              } else if (variant === 'page') {
                // Products page: clear search, show all products
                if (onSearch) {
                  onSearch(''); // Trigger search with empty string
                }
                // Clear URL params
                const url = new URL(window.location.href);
                url.searchParams.delete('search');
                window.history.pushState(null, '', url.pathname);
              }
              
              inputRef.current?.blur();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:opacity-80"
            style={{ color: theme.colors.textSecondary }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && dropdownPosition && createPortal(
        <div 
          className="rounded-lg overflow-hidden shadow-xl max-h-96 overflow-auto search-dropdown-portal"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 999999, // Increased z-index for better layering
            transition: 'opacity 0.2s ease-in-out',
            opacity: dropdownPosition ? 1 : 0,
            pointerEvents: 'auto', // Ensure clicks work
            ...dropdownStyle
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.colors.accent }} />
              <span className="ml-2" style={{ color: theme.colors.textSecondary }}>
                Searching...
              </span>
            </div>
          ) : query.length >= 2 && results.length > 0 ? (
            <div>
              <div 
                className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b"
                style={{ 
                  color: theme.colors.textSecondary,
                  borderColor: theme.colors.border
                }}
              >
                Search Results
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white hover:bg-opacity-5 transition-colors"
                >
                  {result.image && (
                    <img 
                      src={result.image} 
                      alt={result.title}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 text-left">
                    <div style={{ color: theme.colors.textPrimary }}>
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div 
                        className="text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  {result.price && (
                    <div 
                      className="font-semibold"
                      style={{ color: theme.colors.accent }}
                    >
                      {result.price}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div>
              {showRecent && recentSearches.length > 0 && !query && (
                <div>
                  <div 
                    className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b flex items-center gap-2"
                    style={{ 
                      color: theme.colors.textSecondary,
                      borderColor: theme.colors.border
                    }}
                  >
                    <Clock className="w-3 h-3" />
                    Recent Searches
                  </div>
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        console.log('🔍 RECENT SEARCH BUTTON MOUSEDOWN:', search);
                        e.preventDefault();
                        e.stopPropagation();
                        handleTrendingClick(search);
                      }}
                      onClick={(e) => {
                        console.log('🔍 RECENT SEARCH BUTTON CLICKED:', search);
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-white hover:bg-opacity-5 transition-colors cursor-pointer"
                      style={{ 
                        color: theme.colors.textPrimary,
                        WebkitUserSelect: 'none',
                        userSelect: 'none'
                      }}
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}

              {showTrending && !query && (
                <div>
                  <div 
                    className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b flex items-center gap-2"
                    style={{ 
                      color: theme.colors.textSecondary,
                      borderColor: theme.colors.border
                    }}
                  >
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </div>
                  {trendingItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        console.log('⭐ TRENDING BUTTON MOUSEDOWN:', item);
                        e.preventDefault();
                        e.stopPropagation();
                        handleTrendingClick(item);
                      }}
                      onClick={(e) => {
                        console.log('⭐ TRENDING BUTTON CLICKED:', item);
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-white hover:bg-opacity-5 transition-colors cursor-pointer"
                      style={{ 
                        color: theme.colors.textPrimary,
                        WebkitUserSelect: 'none',
                        userSelect: 'none'
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              {query.length > 0 && query.length < 2 && (
                <div 
                  className="px-4 py-6 text-center"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Type at least 2 characters to search
                </div>
              )}

              {query.length >= 2 && results.length === 0 && !loading && (
                <div 
                  className="px-4 py-6 text-center"
                  style={{ color: theme.colors.textSecondary }}
                >
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}