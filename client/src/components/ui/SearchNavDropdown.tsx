import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Clock, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  type: 'product' | 'category' | 'page';
  title: string;
  subtitle?: string;
  image?: string;
  url: string;
  price?: string;
}

interface SearchNavDropdownProps {
  onSearch?: (query: string) => void;
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  showRecent?: boolean;
  showTrending?: boolean;
}

export function SearchNavDropdown({
  onSearch,
  onSelect,
  placeholder = "Search products, categories...",
  className = "",
  showRecent = true,
  showTrending = true
}: SearchNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches] = useState(['Dumbbells', 'Bench Press', 'Protein', 'Yoga Mat']);
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
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
  }, [debouncedQuery]);

  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent).slice(0, 5));
    }
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 500)
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        dropdownRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    
    const recent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(recent);
    localStorage.setItem('recentSearches', JSON.stringify(recent));
    
    if (onSearch) {
      onSearch(searchQuery);
    }
    
    setIsOpen(false);
  };

  const handleResultClick = (result: SearchResult) => {
    if (onSelect) {
      onSelect(result);
    }
    setIsOpen(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={triggerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && query) {
              handleSearch(query);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "w-full pl-12 pr-12 py-3 rounded-lg",
            "bg-white/10 backdrop-blur-md",
            "border border-white/20",
            "text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
            "transition-all duration-200"
          )}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-[999998]"
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div 
                ref={dropdownRef}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-lg overflow-hidden z-[999999] scrollbar-hide"
                style={{
                  position: 'fixed',
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  maxHeight: '500px',
                  background: 'rgba(31, 41, 55, 0.98)',
                  border: '1px solid rgba(156, 163, 175, 0.3)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
              >
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    <p className="mt-4 text-gray-400">Searching...</p>
                  </div>
                ) : query.length >= 2 && results.length > 0 ? (
                  <div className="overflow-y-auto max-h-96">
                    <div className="p-3 border-b border-gray-700">
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Search Results
                      </p>
                    </div>
                    {results.map(result => (
                      <div
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-4"
                      >
                        {result.image && (
                          <img 
                            src={result.image} 
                            alt={result.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="text-white font-medium">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-sm text-gray-400">{result.subtitle}</div>
                          )}
                        </div>
                        {result.price && (
                          <div className="text-blue-400 font-semibold">{result.price}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {showRecent && recentSearches.length > 0 && !query && (
                      <div>
                        <div className="p-3 border-b border-gray-700">
                          <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Recent Searches
                          </p>
                        </div>
                        {recentSearches.map((search, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSearch(search)}
                            className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors text-white"
                          >
                            {search}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {showTrending && !query && (
                      <div>
                        <div className="p-3 border-b border-gray-700">
                          <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            Trending
                          </p>
                        </div>
                        {trendingSearches.map((search, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSearch(search)}
                            className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors text-white"
                          >
                            {search}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {query.length > 0 && query.length < 2 && (
                      <div className="p-8 text-center text-gray-400">
                        Type at least 2 characters to search
                      </div>
                    )}
                    
                    {query.length >= 2 && results.length === 0 && !loading && (
                      <div className="p-8 text-center">
                        <Package className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">No results found for "{query}"</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}