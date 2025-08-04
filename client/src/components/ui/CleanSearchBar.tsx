import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, Package } from 'lucide-react';
import { SimpleDropdown, SimpleDropdownItem, SimpleDropdownSection } from './SimpleDropdown';
import { Input } from './input';
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
  const inputRef = useRef<HTMLInputElement>(null);

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
    inputRef.current?.blur();
  };

  const handleProductSelect = (product: Product) => {
    onProductSelect?.(product);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    inputRef.current?.focus();
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
        <SimpleDropdownSection>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        </SimpleDropdownSection>
      );
    }

    if (query && searchResults.length === 0) {
      return (
        <SimpleDropdownSection>
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <Package size={32} className="mb-2" />
            <p>No products found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        </SimpleDropdownSection>
      );
    }

    if (searchResults.length > 0) {
      return (
        <SimpleDropdownSection title="Products">
          {searchResults.map(product => (
            <div
              key={product.id}
              className="search-result-item cursor-pointer"
              onClick={() => handleProductSelect(product)}
            >
              <div className="search-result-image">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded" />
                ) : (
                  <Package size={20} className="text-muted-foreground" />
                )}
              </div>
              
              <div className="search-result-details">
                <div className="search-result-title">
                  {highlightMatch(product.name, query)}
                </div>
                <div className="search-result-meta">
                  {product.brand && <span>{product.brand}</span>}
                  {product.brand && product.category && <span>•</span>}
                  {product.category && <span>{product.category}</span>}
                  {product.stock !== undefined && (
                    <>
                      <span>•</span>
                      <span className={product.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="search-result-price">
                {formatCurrency(product.price)}
              </div>
            </div>
          ))}
        </SimpleDropdownSection>
      );
    }

    // Show recent and popular searches when no query
    return (
      <>
        {recentSearches.length > 0 && (
          <SimpleDropdownSection title="Recent Searches">
            {recentSearches.map((search, index) => (
              <SimpleDropdownItem
                key={index}
                icon={<Clock size={16} />}
                onClick={() => handleSearch(search)}
              >
                {search}
              </SimpleDropdownItem>
            ))}
          </SimpleDropdownSection>
        )}
        
        <SimpleDropdownSection title="Popular Searches">
          {popularSearches.map((search, index) => (
            <SimpleDropdownItem
              key={index}
              icon={<TrendingUp size={16} />}
              onClick={() => handleSearch(search)}
            >
              {search}
            </SimpleDropdownItem>
          ))}
        </SimpleDropdownSection>
      </>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <SimpleDropdown
        trigger={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              className="pl-10 pr-10"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        }
        align="start"
        className="w-full max-w-md"
      >
        {renderSearchResults()}
      </SimpleDropdown>
    </div>
  );
}