import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Clock, TrendingUp, Package, Sparkles, Loader2, ShoppingCart, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafePortal } from '@/hooks/useSafePortal';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash-es';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  category: string;
  categoryId: number;
  price: number;
  imageUrl?: string;
  brand?: string;
  condition?: string;
  stock?: number;
  featured?: boolean;
}

interface UnifiedSearchDropdownProps {
  context?: 'header' | 'products';
  placeholder?: string;
  onSearch?: (query: string) => void;
  onProductSelect?: (product: Product) => void;
  className?: string;
  value?: string;
  autoFocus?: boolean;
}

export function UnifiedSearchDropdown({ 
  context = 'header', 
  placeholder = 'Search equipment...',
  onSearch,
  onProductSelect,
  className = '',
  value = '',
  autoFocus = false
}: UnifiedSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Safe portal hook to prevent removeChild errors
  const { portalRoot, isReady } = useSafePortal();

  // Popular search terms
  const popularSearches = ['Barbell', 'Dumbbells', 'Power Rack', 'Bench Press', 'Kettlebell', 'Resistance Bands'];

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('cleanflip_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Failed to load recent searches');
      }
    }
  }, []);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      if (onSearch) {
        onSearch(searchQuery);
      }
    }, 300),
    [onSearch]
  );

  // Search products query
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['/api/products/search', query],
    enabled: query.length >= 2 && isOpen,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);
    
    if (newQuery.length >= 2) {
      setIsOpen(true);
      debouncedSearch(newQuery);
    } else {
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close if clicking inside dropdown
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleSearchSubmit = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;
    
    // Save to recent searches
    const updatedSearches = [finalQuery, ...recentSearches.filter(s => s !== finalQuery)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('cleanflip_recent_searches', JSON.stringify(updatedSearches));
    
    setIsOpen(false);
    setLocation(`/products?search=${encodeURIComponent(finalQuery)}`);
  };

  const handleProductSelect = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
    } else {
      setLocation(`/products/${product.id}`);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = (query.length >= 2 ? searchResults.length : 0) + recentSearches.length + popularSearches.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (query.length >= 2 && selectedIndex < searchResults.length) {
            handleProductSelect(searchResults[selectedIndex]);
          } else {
            const suggestionIndex = selectedIndex - (query.length >= 2 ? searchResults.length : 0);
            const suggestions = [...recentSearches, ...popularSearches];
            if (suggestions[suggestionIndex]) {
              handleSearchSubmit(suggestions[suggestionIndex]);
            }
          }
        } else {
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && isReady && portalRoot && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-hidden"
            style={{
              top: dropdownPosition.top + 4,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              minWidth: '300px'
            }}
          >
            <div className="overflow-y-auto max-h-96">
              {/* Search Results */}
              {query.length >= 2 && (
                <>
                  {isLoading ? (
                    <div className="p-4 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-muted-foreground">Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                        Products
                      </div>
                      {searchResults.map((product, index) => (
                        <button
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors ${
                            index === selectedIndex ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{product.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {product.brand && `${product.brand} • `}{product.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-foreground">{formatPrice(product.price)}</p>
                              {product.condition && (
                                <p className="text-xs text-muted-foreground capitalize">{product.condition}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No products found for "{query}"</p>
                    </div>
                  )}
                </>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                    <Clock className="inline h-3 w-3 mr-1" />
                    Recent
                  </div>
                  {recentSearches.map((search, index) => {
                    const adjustedIndex = (query.length >= 2 ? searchResults.length : 0) + index;
                    return (
                      <button
                        key={search}
                        onClick={() => handleSearchSubmit(search)}
                        className={`w-full px-4 py-2 text-left hover:bg-accent transition-colors ${
                          adjustedIndex === selectedIndex ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{search}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Popular Searches */}
              {query.length < 2 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    Popular
                  </div>
                  {popularSearches.map((search, index) => {
                    const adjustedIndex = (query.length >= 2 ? searchResults.length : 0) + recentSearches.length + index;
                    return (
                      <button
                        key={search}
                        onClick={() => handleSearchSubmit(search)}
                        className={`w-full px-4 py-2 text-left hover:bg-accent transition-colors ${
                          adjustedIndex === selectedIndex ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{search}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        portalRoot
      )}
    </div>
  );
}