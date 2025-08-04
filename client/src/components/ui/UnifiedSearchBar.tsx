import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, Package, Sparkles, Loader2, ShoppingCart, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash-es';
import { formatPrice } from '@/lib/utils';
import { 
  Dropdown, 
  DropdownItem, 
  DropdownSection, 
  DropdownDivider, 
  DropdownLoading, 
  DropdownEmpty, 
  DropdownError 
} from './DropdownComponents';

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
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

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
        className={`dropdown-product-item ${isSelected ? 'selected' : ''} group`}
        onMouseDown={(e) => {
          e.preventDefault();
          handleProductSelect(product);
        }}
        onMouseEnter={() => setSelectedIndex(index)}
      >
        {/* Product Image */}
        <div className="product-image">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          ) : (
            <Package size={24} className="text-muted-foreground" />
          )}
          {product.featured && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <Sparkles size={12} className="text-gray-900" />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="product-details">
          <h4 className="product-title">
            {highlightMatch(product.name, query)}
          </h4>
          <div className="product-meta">
            <span>{product.brand}</span>
            <span className="text-muted-foreground">•</span>
            <span>{product.category}</span>
            {product.condition && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-green-400">{product.condition}</span>
              </>
            )}
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="product-price">{formatPrice(product.price)}</p>
            {product.stock !== undefined && (
              <p className="product-stock">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1.5 hover:bg-accent rounded-md transition-colors">
              <Heart size={16} className="text-muted-foreground" />
            </button>
            <button className="p-1.5 hover:bg-accent rounded-md transition-colors">
              <ShoppingCart size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
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
            <>
              <DropdownSection title="Recent Searches" icon={<Clock size={14} />}>
                {recentSearches.map((search, idx) => (
                  <DropdownItem
                    key={idx}
                    onSelect={() => handleSearch(search)}
                    selected={selectedIndex === idx}
                    icon={<Clock size={14} className="text-muted-foreground" />}
                  >
                    {search}
                  </DropdownItem>
                ))}
              </DropdownSection>
              <DropdownDivider />
            </>
          )}
          
          <DropdownSection title="Popular Searches" icon={<TrendingUp size={14} />}>
            {popularSearches.map((term: string, idx: number) => (
              <DropdownItem
                key={idx}
                onSelect={() => handleSearch(term)}
                icon={<Sparkles size={14} className="text-muted-foreground" />}
              >
                {term}
              </DropdownItem>
            ))}
          </DropdownSection>
        </div>
      );
    }

    // Loading state
    if (isLoading) {
      return <DropdownLoading text={`Searching for "${query}"...`} />;
    }

    // Error state
    if (error) {
      return <DropdownError title="Search failed" subtitle="Please try again" />;
    }

    // Results
    if (products.length > 0) {
      return (
        <div className="py-2">
          <DropdownSection 
            title="Products" 
            icon={<Package size={14} />}
          >
            <div className="text-xs text-muted-foreground px-4 mb-2">
              {products.length} result{products.length !== 1 ? 's' : ''}
            </div>
            <div className="space-y-1">
              {products.map((product: Product, idx: number) => renderProductItem(product, idx))}
            </div>
            {context === 'header' && products.length >= 8 && (
              <>
                <DropdownDivider />
                <DropdownItem onSelect={() => handleSearch(query)}>
                  <span className="text-blue-400">View all results →</span>
                </DropdownItem>
              </>
            )}
          </DropdownSection>
        </div>
      );
    }

    // No results
    return (
      <DropdownEmpty 
        title={`No products found for "${query}"`}
        subtitle="Try different keywords"
        icon={<Package className="w-12 h-12 text-muted-foreground" />}
      />
    );
  };

  const searchInput = (
    <div className={`relative ${className}`}>
      <div className="relative group">
        {/* Search Icon */}
        <div className="search-icon-container">
          <Search 
            className={`w-4 h-4 transition-colors duration-200 ${
              isOpen ? 'text-blue-400' : 'text-muted-foreground'
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
          className="search-input"
        />
        
        {/* Clear Button */}
        <AnimatePresence>
          {query && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="search-clear-button"
            >
              <button
                type="button"
                onClick={handleClear}
              >
                <X size={16} className="text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={searchInput}
      modal={true}
    >
      {renderDropdownContent()}
    </Dropdown>
  );
}