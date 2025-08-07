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

interface UnifiedSearchBarProps {
  context?: 'header' | 'products';
  placeholder?: string;
  onSearch?: (query: string) => void;
  onProductSelect?: (product: Product) => void;
  className?: string;
  value?: string;
  autoFocus?: boolean;
}

export function UnifiedSearchBar({ 
  context = 'header', 
  placeholder = 'Search equipment...',
  onSearch,
  onProductSelect,
  className = '',
  value = '',
  autoFocus = false
}: UnifiedSearchBarProps) {
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
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      if (searchQuery.length >= 2) {
        queryClient.invalidateQueries({ queryKey: ['search', searchQuery] });
      }
    }, 300),
    [queryClient]
  );

  // Fetch search results
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (query.length < 2) return { products: [] };
      
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=8`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: isOpen && query.length >= 2,
    staleTime: 60000,
    gcTime: 300000,
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    debouncedSearch(newQuery);
    
    if (context === 'products') {
      onSearch?.(newQuery);
    }
    
    if (context === 'header' && !newQuery && query) {
      setLocation('/');
    }
  };

  // Save to recent searches
  const saveRecentSearch = (term: string) => {
    if (!term || term.length < 2) return;
    
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('cleanflip_recent_searches', JSON.stringify(updated));
  };

  // Handle search submission
  const handleSearch = (searchTerm: string) => {
    if (!searchTerm) return;
    
    saveRecentSearch(searchTerm);
    setQuery(searchTerm);
    setIsOpen(false);
    
    if (context === 'header') {
      setLocation(`/products?search=${encodeURIComponent(searchTerm)}`);
    } else {
      onSearch?.(searchTerm);
    }
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    saveRecentSearch(product.name);
    setIsOpen(false);
    
    if (context === 'header') {
      setLocation(`/products/${product.id}`);
    } else {
      const element = document.getElementById(`product-${product.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'transition-all', 'duration-500');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }, 2000);
      }
      onProductSelect?.(product);
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
    
    if (context === 'header') {
      setLocation('/');
    } else {
      onSearch?.('');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const results = searchResults?.products || [];
      const totalItems = query ? results.length : recentSearches.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % Math.max(1, totalItems));
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
          break;
          
        case 'Enter':
          e.preventDefault();
          if (query && results[selectedIndex]) {
            handleProductSelect(results[selectedIndex]);
          } else if (!query && recentSearches[selectedIndex]) {
            handleSearch(recentSearches[selectedIndex]);
          } else if (query) {
            handleSearch(query);
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, searchResults, query, recentSearches]);

  // Highlight matching text
  const highlightMatch = (text: string, match: string) => {
    if (!match || match.length < 2) return text;
    
    const regex = new RegExp(`(${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) 
        ? <mark key={i} className="highlight-match">{part}</mark>
        : part
    );
  };

  // Render product item
  const renderProductItem = (product: Product, index: number) => {
    const isSelected = selectedIndex === index;
    
    return (
      <div
        key={product.id}
        className={`w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-gray-900/10 flex items-center gap-3 cursor-pointer ${isSelected ? 'bg-gray-900/10' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          handleProductSelect(product);
        }}
        onMouseEnter={() => setSelectedIndex(index)}
      >
        {/* Product Image */}
        <div className="w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          ) : (
            <Package size={20} className="text-gray-400" />
          )}
          {product.featured && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
              <Sparkles size={8} className="text-white" />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">
            {highlightMatch(product.name, query)}
          </div>
          <div className="text-sm text-gray-400 truncate">
            {product.brand && <span>{product.brand}</span>}
            {product.brand && product.category && <span className="mx-1">•</span>}
            {product.category && <span>{product.category}</span>}
            {product.condition && (
              <>
                <span className="mx-1">•</span>
                <span className="text-green-400">{product.condition}</span>
              </>
            )}
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="font-semibold text-white">{formatPrice(product.price)}</div>
            {product.stock !== undefined && (
              <div className="text-xs text-gray-400">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded bg-gray-600 flex items-center justify-center hover:bg-gray-9000 transition-colors">
              <Heart size={12} className="text-gray-400" />
            </div>
            <div className="w-6 h-6 rounded bg-gray-600 flex items-center justify-center hover:bg-gray-9000 transition-colors">
              <ShoppingCart size={12} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render dropdown content
  const renderDropdownContent = () => {
    const products = searchResults?.products || [];
    
    // Empty state or loading
    if (!query && context === 'products') {
      return (
        <div className="py-6 px-4 text-center">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-400">Start typing to search products</p>
        </div>
      );
    }

    // Recent and popular searches (empty query state)
    if (!query && context === 'header') {
      return (
        <div className="p-2 space-y-1">
          {recentSearches.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 mb-2">
                <Clock size={12} className="inline mr-2" />
                Recent Searches
              </div>
              {recentSearches.map((search: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(search)}
                  className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-gray-900/10 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center">
                    <Clock size={16} className="text-gray-400" />
                  </div>
                  <span className="text-white font-medium">{search}</span>
                </button>
              ))}
              <div className="border-t border-white/10 pt-2 mt-2" />
            </>
          )}
          
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <TrendingUp size={12} className="inline mr-2" />
            Popular Searches
          </div>
          {popularSearches.map((term: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleSearch(term)}
              className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-gray-900/10 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center">
                <Sparkles size={16} className="text-gray-400" />
              </div>
              <span className="text-white font-medium">{term}</span>
            </button>
          ))}
        </div>
      );
    }

    // Loading state
    if (isLoading) {
      return (
        <div className="py-6 px-4 text-center">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
          <p className="text-sm text-gray-400">{`Searching for "${query}"...`}</p>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="py-6 px-4 text-center">
          <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-sm text-white font-medium">Search failed</p>
          <p className="text-xs text-gray-400">Please try again</p>
        </div>
      );
    }

    // Results
    if (products.length > 0) {
      return (
        <div className="p-2 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 mb-2">
            <Package size={12} className="inline mr-2" />
            Products ({products.length} result{products.length !== 1 ? 's' : ''})
          </div>
          {products.map((product: Product, idx: number) => renderProductItem(product, idx))}
          {context === 'header' && products.length >= 8 && (
            <>
              <div className="border-t border-white/10 pt-2 mt-2" />
              <button
                onClick={() => handleSearch(query)}
                className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-gray-900/10 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Search size={16} className="text-white" />
                </div>
                <span className="text-blue-400 font-medium">View all results →</span>
              </button>
            </>
          )}
        </div>
      );
    }

    // No results
    return (
      <div className="py-6 px-4 text-center">
        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Package className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-white font-medium">{`No products found for "${query}"`}</p>
        <p className="text-xs text-gray-400">Try different keywords</p>
      </div>
    );
  };



  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className={`relative group glass rounded-lg transition-all duration-200 ${isOpen ? 'active border-primary' : 'border-border'}`}>
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Search 
            className={`w-4 h-4 transition-colors duration-200 ${
              isOpen ? 'text-blue-400' : 'text-gray-400'
            }`} 
          />
        </div>
        
        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full pl-10 pr-10 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none"
        />
        
        {/* Clear Button */}
        <AnimatePresence>
          {query && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <button
                type="button"
                onClick={handleClear}
                className="hover:text-white transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Safe Portal Dropdown */}
      {isReady && portalRoot && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20" 
                style={{ zIndex: 999998 }}
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown Content */}
              <motion.div 
                key="dropdown"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                ref={dropdownRef}
                className="rounded-lg overflow-hidden max-h-96 overflow-y-auto"
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
                {renderDropdownContent()}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        portalRoot
      )}
    </div>
  );
}