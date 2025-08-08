// UNIFIED SEARCH FOR NAVIGATION AND SEARCH BARS
import { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocation } from 'wouter';

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
  inputClassName?: string;
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
  inputClassName = "",
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
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const [, navigate] = useLocation();

  // Sample trending items (replace with API call)
  const trendingItems = ['Dumbbells', 'Bench Press', 'Protein', 'Yoga Mat'];

  // Load recent searches
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent).slice(0, 5));
    }
  }, []);

  // Fetch search results
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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSearch = (searchQuery: string) => {
    // Save to recent
    const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
    
    setIsOpen(false);
    setQuery('');
  };

  const handleSelect = (result: SearchResult) => {
    if (onSelect) {
      onSelect(result);
    } else {
      navigate(result.url);
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
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
            "w-full pl-10 pr-10 py-2.5 rounded-lg",
            "bg-gray-800/50 border border-gray-700",
            "text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
            "transition-all duration-200",
            inputClassName
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute z-50 w-full mt-2",
          "bg-gray-800 border border-gray-700 rounded-lg",
          "shadow-xl max-h-96 overflow-auto",
          variant === 'navbar' ? "min-w-[400px]" : "w-full"
        )}>
          {loading ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-400">Searching...</p>
            </div>
          ) : query.length >= 2 && results.length > 0 ? (
            <div>
              <div className="px-3 py-2 border-b border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Search Results
                </p>
              </div>
              {results.map(result => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full px-4 py-3 hover:bg-gray-700/50 transition-colors text-left flex items-center gap-3"
                >
                  {result.image && (
                    <img 
                      src={result.image} 
                      alt={result.title}
                      className="w-10 h-10 object-cover rounded"
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
                </button>
              ))}
            </div>
          ) : (
            <div>
              {showRecent && recentSearches.length > 0 && !query && (
                <div>
                  <div className="px-3 py-2 border-b border-gray-700 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Recent</p>
                  </div>
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(search);
                        handleSearch(search);
                      }}
                      className="w-full px-4 py-2.5 hover:bg-gray-700/50 text-left text-white transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
              
              {showTrending && !query && (
                <div>
                  <div className="px-3 py-2 border-b border-gray-700 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Trending</p>
                  </div>
                  {trendingItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(item);
                        handleSearch(item);
                      }}
                      className="w-full px-4 py-2.5 hover:bg-gray-700/50 text-left text-white transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              {query.length > 0 && query.length < 2 && (
                <div className="p-4 text-center text-gray-400">
                  Type at least 2 characters to search
                </div>
              )}

              {query.length >= 2 && results.length === 0 && !loading && (
                <div className="p-4 text-center text-gray-400">
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}