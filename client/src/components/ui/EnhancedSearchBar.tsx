import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, Package, Sparkles, Loader2, ShoppingCart, Heart } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

interface SearchBarProps {
  context?: 'header' | 'products';
  placeholder?: string;
  onSearch?: (query: string) => void;
  onProductSelect?: (product: Product) => void;
  className?: string;
  value?: string;
  autoFocus?: boolean;
}

export function EnhancedSearchBar({ 
  context = 'header', 
  placeholder = 'Search equipment...',
  onSearch,
  onProductSelect,
  className = '',
  value = '',
  autoFocus = false
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Popular search terms
  const popularSearches = ['Barbell', 'Dumbbells', 'Power Rack', 'Bench Press', 'Kettlebell', 'Resistance Bands'];

  // Load recent searches and detect mobile
  useEffect(() => {
    const saved = localStorage.getItem('cleanflip_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Failed to load recent searches');
      }
    }
    
    // Detect mobile and update on resize
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate dropdown width - wider on desktop, full width on mobile
      const dropdownWidth = isMobile 
        ? viewportWidth - 32 // Mobile: full width with padding
        : Math.min(Math.max(rect.width * 1.2, 400), 600); // Desktop: responsive width
      
      let left = rect.left;
      let top = rect.bottom + 8;
      
      // Position adjustments for desktop
      if (!isMobile) {
        // Ensure dropdown doesn't go off-screen horizontally
        if (left + dropdownWidth > viewportWidth) {
          left = viewportWidth - dropdownWidth - 16;
        }
        left = Math.max(16, left);
        
        // Ensure dropdown doesn't go off-screen vertically
        const maxDropdownHeight = 400; // Approximate max dropdown height
        if (top + maxDropdownHeight > viewportHeight) {
          top = rect.top - maxDropdownHeight - 8; // Show above input
        }
      } else {
        // Mobile positioning - full width with padding, below fixed header
        left = 16;
        top = 72; // Fixed position below header
      }
      
      setDropdownPosition({
        top,
        left,
        width: dropdownWidth,
      });
    }
  }, []);

  // Update position when opening - use layoutEffect for sync calculation
  useLayoutEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);
      
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition, true);
      };
    }
  }, [isOpen, updateDropdownPosition]);

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
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Debounced search
    debouncedSearch(newQuery);
    
    // For products page, update filters immediately
    if (context === 'products') {
      onSearch?.(newQuery);
    }
    
    // If header search is cleared, go to home
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
    setIsAnimating(true);
    
    // Add to recent searches
    saveRecentSearch(product.name);
    
    // Close dropdown with animation
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
      
      if (context === 'header') {
        setLocation(`/products/${product.id}`);
      } else {
        // For products page, smooth scroll and highlight
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
    }, 150);
  };

  // Clear search - moved inline to X button click handler

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isAnimating) return;

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
  }, [isOpen, selectedIndex, searchResults, query, recentSearches, isAnimating]);

  // Click outside handler and mobile body scroll prevention
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current && 
        !inputRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      // Prevent body scroll on mobile when search is open
      if (isMobile) {
        document.body.classList.add('search-modal-open');
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        if (isMobile) {
          document.body.classList.remove('search-modal-open');
        }
      };
    }
  }, [isOpen, isMobile]);

  // Render product item
  const renderProductItem = (product: Product, index: number) => {
    const isSelected = selectedIndex === index;
    
    return (
      <motion.button
        key={product.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        type="button"
        className={`
          w-full px-4 py-3 flex items-center gap-4
          hover:bg-gray-800/50 rounded-lg transition-all duration-200
          ${isSelected ? 'bg-gray-800/50' : ''}
          group relative overflow-hidden
        `}
        onMouseDown={(e) => {
          e.preventDefault();
          handleProductSelect(product);
        }}
        onMouseEnter={() => setSelectedIndex(index)}
      >
        {/* Product Image */}
        <div className="relative flex-shrink-0">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
              <Package size={24} className="text-gray-600" />
            </div>
          )}
          {product.featured && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <Sparkles size={12} className="text-gray-900" />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 text-left min-w-0">
          <h4 className="text-gray-100 font-medium truncate group-hover:text-white transition-colors">
            {highlightMatch(product.name, query)}
          </h4>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{product.brand}</span>
            <span className="text-gray-600">•</span>
            <span>{product.category}</span>
            {product.condition && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-green-400">{product.condition}</span>
              </>
            )}
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-gray-100 font-semibold">{formatPrice(product.price)}</p>
            {product.stock !== undefined && (
              <p className="text-xs text-gray-500">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1.5 hover:bg-gray-700 rounded-md transition-colors">
              <Heart size={16} className="text-gray-400" />
            </button>
            <button className="p-1.5 hover:bg-gray-700 rounded-md transition-colors">
              <ShoppingCart size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </motion.button>
    );
  };

  // Highlight matching text
  const highlightMatch = (text: string, match: string) => {
    if (!match || match.length < 2) return text;
    
    const regex = new RegExp(`(${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) 
        ? <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">{part}</mark>
        : part
    );
  };

  // Render dropdown content
  const renderDropdownContent = () => {
    const products = searchResults?.products || [];
    
    // No query - show recent/popular searches
    if (!query) {
      return (
        <div className="py-2">
          {recentSearches.length > 0 && (
            <div className="mb-4">
              <div className="px-4 py-2 flex items-center gap-2">
                <Clock size={14} className="text-gray-500" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Recent Searches
                </span>
              </div>
              {recentSearches.map((search, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  type="button"
                  className={`
                    w-full px-4 py-2.5 text-left flex items-center gap-3
                    hover:bg-gray-800/50 rounded-lg transition-all
                    ${selectedIndex === idx ? 'bg-gray-800/50' : ''}
                  `}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSearch(search);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <Clock size={14} className="text-gray-500" />
                  <span className="text-gray-200">{search}</span>
                </motion.button>
              ))}
            </div>
          )}
          
          <div>
            <div className="px-4 py-2 flex items-center gap-2">
              <TrendingUp size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Popular Searches
              </span>
            </div>
            {popularSearches.map((term: string, idx: number) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (recentSearches.length + idx) * 0.05 }}
                type="button"
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-800/50 rounded-lg transition-all"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSearch(term);
                }}
              >
                <Sparkles size={14} className="text-gray-500" />
                <span className="text-gray-200">{term}</span>
              </motion.button>
            ))}
          </div>
        </div>
      );
    }

    // Loading state
    if (isLoading) {
      return (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Searching for "{query}"...</p>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="py-12 text-center">
          <p className="text-red-400 mb-2">Search failed</p>
          <p className="text-sm text-gray-500">Please try again</p>
        </div>
      );
    }

    // Results
    if (products.length > 0) {
      return (
        <div className="py-2">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Products
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {products.length} result{products.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1">
            {products.map((product: Product, idx: number) => renderProductItem(product, idx))}
          </div>
          {context === 'header' && products.length >= 8 && (
            <div className="px-4 py-3 border-t border-gray-800">
              <button
                type="button"
                className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSearch(query);
                }}
              >
                View all results →
              </button>
            </div>
          )}
        </div>
      );
    }

    // No results
    return (
      <div className="py-12 text-center">
        <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 mb-2">No products found for "{query}"</p>
        <p className="text-sm text-gray-500">Try different keywords</p>
      </div>
    );
  };

  // Render search dropdown
  const dropdown = isOpen && !isAnimating && createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        ref={dropdownRef}
        key="search-dropdown"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ 
          duration: 0.15,
          ease: 'easeOut'
        }}
        className={`
          fixed z-[999999] search-dropdown
          ${isMobile ? 'search-dropdown-mobile' : ''}
        `}
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          transformOrigin: '0 0',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased',
          transform: 'translateZ(0)',
          willChange: 'transform, opacity'
        }}
      >
        <div className={`
          bg-gray-900/98 backdrop-blur-2xl border border-gray-700/50 shadow-2xl overflow-hidden
          ${isMobile ? 'rounded-t-xl' : 'rounded-xl'}
        `}>
          <div className={`overflow-y-auto custom-scrollbar ${
            isMobile ? 'max-h-[80vh]' : 'max-h-[70vh]'
          }`}>
            {renderDropdownContent()}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      <div className={`relative ${className}`}>
        <div className="relative group">
          {/* Search Icon Container - Fixed positioning and perfect centering */}
          <div className="search-icon-container absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none z-10">
            <Search 
              className={`w-4 h-4 transition-colors duration-200 z-10 ${
                isOpen ? 'text-blue-400' : 'text-gray-400'
              }`} 
            />
          </div>
          
          {/* Search Input - Fixed height and improved styling */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              // Calculate position first, then open
              updateDropdownPosition();
              requestAnimationFrame(() => {
                setTimeout(() => {
                  setIsOpen(true);
                  setSelectedIndex(-1);
                }, 50);
              });
            }}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={`
              search-input w-full h-12 pl-12 pr-12 
              bg-gray-800 hover:bg-gray-800/90 focus:bg-gray-800
              border border-gray-700/50 hover:border-gray-600/50 focus:border-blue-500/50
              rounded-xl text-gray-100 placeholder-gray-500
              transition-all duration-200 outline-none line-height-1
              ring-0 focus:ring-2 focus:ring-blue-500/20 focus:shadow-[0_0_30px_rgba(59,130,246,0.15)]
              ${isOpen ? 'shadow-lg' : ''}
              -webkit-appearance-none
            `}
            style={{ 
              lineHeight: 1,
              WebkitAppearance: 'none'
            }}
          />
          
          {/* Clear Button - Perfect centering and smooth animation */}
          <AnimatePresence>
            {query && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQuery('');
                    setIsOpen(false);
                    inputRef.current?.blur();
                    
                    if (context === 'header') {
                      setLocation('/');
                    } else {
                      onSearch?.('');
                    }
                  }}
                  className="h-8 w-8 flex items-center justify-center hover:bg-gray-700/50 rounded-md transition-all duration-200 touch-action-manipulation"
                >
                  <X size={16} className="text-gray-400 hover:text-gray-200 transition-colors" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {dropdown}
    </>
  );
}