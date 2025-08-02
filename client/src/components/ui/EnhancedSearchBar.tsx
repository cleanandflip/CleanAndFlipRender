import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, Package, Sparkles, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SearchResult {
  id: number;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  brand?: string;
}

interface EnhancedSearchBarProps {
  context?: 'header' | 'products';
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  value?: string;
}

export function EnhancedSearchBar({ 
  context = 'header', 
  placeholder = 'Search equipment...',
  onSearch,
  className = '',
  value = ''
}: EnhancedSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<{ top?: number; left?: number; width?: number }>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

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

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      const response = await api.get(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      return response.products || [];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    
    // Save to recent searches
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    if (context === 'header') {
      setLocation(`/products?search=${encodeURIComponent(searchTerm)}`);
    } else {
      onSearch?.(searchTerm);
    }
    
    setIsOpen(false);
  };

  // Handle product selection
  const handleProductSelect = (product: SearchResult) => {
    if (context === 'header') {
      setLocation(`/products/${product.id}`);
    } else {
      // Scroll to product on products page
      const element = document.getElementById(`product-${product.id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight effect
      element?.classList.add('ring-2', 'ring-blue-500', 'transition-all');
      setTimeout(() => {
        element?.classList.remove('ring-2', 'ring-blue-500');
      }, 2000);
    }
    
    setIsOpen(false);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            Math.min(prev + 1, (searchResults?.length || 0) - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && searchResults?.[selectedIndex]) {
            handleProductSelect(searchResults[selectedIndex]);
          } else if (query) {
            handleSearch(query);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, searchResults, query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render dropdown content
  const renderDropdownContent = () => {
    // Show recent searches when no query
    if (!query && recentSearches.length > 0) {
      return (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Clock size={12} />
            Recent Searches
          </div>
          {recentSearches.map((search, idx) => (
            <button
              key={idx}
              type="button"
              className={`
                w-full px-3 py-2.5 text-left flex items-center gap-3
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
            </button>
          ))}
        </div>
      );
    }

    // Show loading state
    if (isLoading && query.length >= 2) {
      return (
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Searching...</p>
        </div>
      );
    }

    // Show search results
    if (searchResults && searchResults.length > 0) {
      return (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Package size={12} />
            Products
          </div>
          {searchResults.map((product: SearchResult, idx: number) => (
            <button
              key={product.id}
              type="button"
              className={`
                w-full px-3 py-3 text-left flex items-center gap-4
                hover:bg-gray-800/50 rounded-lg transition-all
                ${selectedIndex === idx ? 'bg-gray-800/50' : ''}
              `}
              onMouseDown={(e) => {
                e.preventDefault();
                handleProductSelect(product);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              {product.imageUrl && (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-md"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-gray-200 font-medium truncate">
                  {highlightMatch(product.name, query)}
                </p>
                <p className="text-xs text-gray-400">
                  {product.brand} • {product.category}
                </p>
              </div>
              <p className="text-gray-300 font-semibold">${product.price}</p>
            </button>
          ))}
        </div>
      );
    }

    // Show no results
    if (query.length >= 2 && !isLoading) {
      return (
        <div className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">No products found</p>
          <p className="text-sm text-gray-500">Try a different search term</p>
        </div>
      );
    }

    // Show trending/popular searches
    return (
      <div className="p-2">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={12} />
          Popular Searches
        </div>
        {['Barbell', 'Dumbbells', 'Power Rack', 'Bench'].map((term, idx) => (
          <button
            key={idx}
            type="button"
            className="w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-gray-800/50 rounded-lg transition-all"
            onMouseDown={(e) => {
              e.preventDefault();
              handleSearch(term);
            }}
          >
            <Sparkles size={14} className="text-gray-500" />
            <span className="text-gray-200">{term}</span>
          </button>
        ))}
      </div>
    );
  };

  // Highlight matching text
  const highlightMatch = (text: string, match: string) => {
    if (!match) return text;
    const parts = text.split(new RegExp(`(${match})`, 'gi'));
    return parts.map((part: string, i: number) => 
      part.toLowerCase() === match.toLowerCase() 
        ? <span key={i} className="bg-yellow-500/20 text-yellow-300 px-0.5 rounded">{part}</span>
        : part
    );
  };

  // Render search dropdown
  const dropdown = isOpen && createPortal(
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, x: -20, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -10, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="fixed z-[999999]"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
      }}
    >
      <div className="bg-gray-900/98 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
        {renderDropdownContent()}
      </div>
    </motion.div>,
    document.body
  );

  return (
    <>
      <div className={`relative ${className}`}>
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`
              w-full pl-10 pr-10 py-3 
              bg-gray-800/60 hover:bg-gray-800/80 focus:bg-gray-800/90
              border border-gray-700/50 hover:border-gray-600/50 focus:border-gray-500/50
              rounded-xl text-gray-100 placeholder-gray-500
              transition-all duration-200 outline-none
              focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg
              ${isOpen ? 'shadow-lg' : ''}
            `}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700/50 rounded-md transition-colors"
            >
              <X size={16} className="text-gray-400 hover:text-gray-200" />
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {dropdown}
      </AnimatePresence>
    </>
  );
}