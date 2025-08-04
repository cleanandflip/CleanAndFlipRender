import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Clock, TrendingUp, Package } from 'lucide-react';
// Format price utility function
const formatCurrency = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

interface Product {
  id: string;
  name: string;
  price: number;
  brand?: string;
  category?: string;
  imageUrl?: string;
  stock?: number;
}

interface CleanSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onProductSelect?: (product: Product) => void;
  className?: string;
}

export function CleanSearchBar({ 
  placeholder = "Search equipment...",
  onSearch,
  onProductSelect,
  className = ""
}: CleanSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Power Rack', 'Kettlebell', 'Dumbbells', 'Barbell'
  ]);
  const [popularSearches] = useState<string[]>([
    'Barbell', 'Dumbbells', 'Power Rack', 'Bench Press', 'Kettlebell', 'Resistance Bands'
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Mock search function - replace with real API call
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock results - replace with real API call
    const mockResults: Product[] = [
      {
        id: '1',
        name: 'Olympic Barbell 45lb',
        price: 299.99,
        brand: 'Rogue',
        category: 'Barbells',
        imageUrl: undefined,
        stock: 5
      },
      {
        id: '2', 
        name: 'Adjustable Dumbbells Set',
        price: 899.99,
        brand: 'PowerBlocks',
        category: 'Dumbbells',
        imageUrl: undefined,
        stock: 2
      }
    ].filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setSearchResults(mockResults);
    setIsLoading(false);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    onSearch?.(searchQuery);
    
    // Add to recent searches
    if (searchQuery && !recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev.slice(0, 3)]);
    }
    
    setIsOpen(false);
  };

  const handleProductSelect = (product: Product) => {
    onProductSelect?.(product);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
  };

  const highlightMatch = (text: string, match: string) => {
    if (!match || match.length < 2) return text;
    
    const regex = new RegExp(`(${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) 
        ? <mark key={i} style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}>{part}</mark>
        : part
    );
  };

  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
        </div>
      );
    }

    if (query && searchResults.length === 0) {
      return (
        <div className="flex flex-col items-center py-8 text-gray-400">
          <Package size={32} className="mb-2" />
          <p>No products found</p>
          <p className="text-sm">Try a different search term</p>
        </div>
      );
    }

    if (searchResults.length > 0) {
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            PRODUCTS
          </div>
          {searchResults.map(product => (
            <button
              key={product.id}
              onClick={() => handleProductSelect(product)}
              className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-white/10 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center flex-shrink-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Package size={20} className="text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">
                  {highlightMatch(product.name, query)}
                </div>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  {product.brand && <span>{product.brand}</span>}
                  {product.brand && product.category && <span>•</span>}
                  {product.category && <span>{product.category}</span>}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-white">
                  {formatCurrency(product.price)}
                </div>
                {product.stock !== undefined && (
                  <div className={`text-xs ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      );
    }

    // Show recent and popular searches when no query
    return (
      <div className="space-y-4">
        {recentSearches.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              RECENT SEARCHES
            </div>
            <div className="space-y-1">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-white/10 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <Clock size={16} className="text-gray-400" />
                  </div>
                  <span className="text-white font-medium">{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            POPULAR SEARCHES
          </div>
          <div className="space-y-1">
            {popularSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleSearch(search)}
                className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-white/10 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={16} className="text-gray-400" />
                </div>
                <span className="text-white font-medium">{search}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Click outside handler
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className={`relative group ${isOpen ? 'active' : ''}`} 
           style={{
             background: 'rgba(75, 85, 99, 0.4)',
             border: isOpen ? '1px solid #3b82f6' : '1px solid rgba(156, 163, 175, 0.4)',
             borderRadius: '0.5rem',
             transition: 'all 0.2s ease'
           }}>
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
          ref={triggerRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full pl-10 pr-10 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none"
        />
        
        {/* Clear Button */}
        {query && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <button
              type="button"
              onClick={clearSearch}
              className="hover:text-white transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Portal Dropdown */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20" 
            style={{ zIndex: 999998 }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div 
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
            {renderSearchResults()}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}