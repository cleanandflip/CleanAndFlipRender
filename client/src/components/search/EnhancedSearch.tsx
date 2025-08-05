import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/shared/AnimatedComponents";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "wouter";
import { Search, Clock, TrendingUp, X } from "lucide-react";

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'brand';
  count?: number;
}

interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

interface PopularSearch {
  query: string;
  count: number;
}

interface EnhancedSearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function EnhancedSearch({ 
  onSearch, 
  placeholder = "Search for fitness equipment...",
  className = ""
}: EnhancedSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Get search suggestions
  const { data: suggestions = [] } = useQuery<SearchSuggestion[]>({
    queryKey: [`/api/search/suggestions`, debouncedQuery],
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get popular searches
  const { data: popularSearches = [] } = useQuery<PopularSearch[]>({
    queryKey: ['/api/search/popular'],
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cleanflip_recent_searches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed.slice(0, 5)); // Keep only 5 most recent
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      query: searchQuery.trim(),
      timestamp: Date.now()
    };
    
    const updated = [
      newSearch,
      ...recentSearches.filter(search => search.query !== searchQuery.trim())
    ].slice(0, 5);
    
    setRecentSearches(updated);
    localStorage.setItem('cleanflip_recent_searches', JSON.stringify(updated));
  };

  // Handle search submission
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    saveRecentSearch(searchQuery);
    setIsOpen(false);
    setQuery('');
    
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(query);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearRecentSearch = (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(search => search.id !== searchId);
    setRecentSearches(updated);
    localStorage.setItem('cleanflip_recent_searches', JSON.stringify(updated));
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('cleanflip_recent_searches');
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-4 h-12 text-lg"
        />
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto z-50 p-0">
          {/* Current search suggestions */}
          {debouncedQuery.length >= 2 && suggestions.length > 0 && (
            <div className="p-4 border-b border-border/30">
              <h3 className="text-sm font-semibold text-text-secondary mb-3">Suggestions</h3>
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSearch(suggestion.text)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Search size={16} className="text-text-secondary" />
                        <span>{suggestion.text}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.type}
                        </Badge>
                        {suggestion.count && (
                          <span className="text-xs text-text-secondary">
                            {suggestion.count} items
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 && debouncedQuery.length < 2 && (
            <div className="p-4 border-b border-border/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-secondary">Recent Searches</h3>
                <button
                  onClick={clearAllRecentSearches}
                  className="text-xs text-accent-blue hover:text-accent-blue/80"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((recent) => (
                  <button
                    key={recent.id}
                    onClick={() => handleSearch(recent.query)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-text-secondary" />
                        <span>{recent.query}</span>
                      </div>
                      <button
                        onClick={(e) => clearRecentSearch(recent.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular searches */}
          {popularSearches.length > 0 && debouncedQuery.length < 2 && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-text-secondary mb-3">Popular Searches</h3>
              <div className="space-y-1">
                {popularSearches.slice(0, 5).map((popular) => (
                  <button
                    key={popular.query}
                    onClick={() => handleSearch(popular.query)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp size={16} className="text-text-secondary" />
                        <span>{popular.query}</span>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {popular.count} searches
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {debouncedQuery.length >= 2 && suggestions.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-text-secondary">No suggestions found</p>
              <button
                onClick={() => handleSearch(debouncedQuery)}
                className="text-accent-blue hover:text-accent-blue/80 text-sm mt-2"
              >
                Search for "{debouncedQuery}"
              </button>
            </div>
          )}

          {/* Empty state */}
          {debouncedQuery.length < 2 && recentSearches.length === 0 && popularSearches.length === 0 && (
            <div className="p-4 text-center">
              <Search className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="text-text-secondary">Start typing to search</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}