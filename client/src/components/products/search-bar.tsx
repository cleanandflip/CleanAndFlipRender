import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

interface SearchHistory {
  query: string;
  timestamp: number;
}

interface PopularSearch {
  query: string;
  count: number;
}

export function SearchBar({ 
  placeholder = "Search equipment...", 
  onSearch, 
  className 
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Popular searches - could be fetched from API
  const popularSearches: PopularSearch[] = [
    { query: "Olympic Barbell", count: 156 },
    { query: "Weight Plates", count: 134 },
    { query: "Power Rack", count: 98 },
    { query: "Dumbbells", count: 87 },
    { query: "Bench Press", count: 76 },
    { query: "Kettlebells", count: 65 }
  ];

  // Equipment suggestions for autocomplete
  const equipmentSuggestions = [
    "Olympic Barbell", "Weight Plates", "Power Rack", "Dumbbells", 
    "Bench Press", "Kettlebells", "Resistance Bands", "Pull-up Bar",
    "Squat Rack", "Cable Machine", "Leg Press", "Smith Machine",
    "Rowing Machine", "Treadmill", "Exercise Bike", "Elliptical"
  ];

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to parse search history:', error);
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [
      { query: query.trim(), timestamp: Date.now() },
      ...searchHistory.filter(item => item.query !== query.trim())
    ].slice(0, 10); // Keep only last 10 searches
    
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Handle input changes and filter suggestions
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    
    if (value.length >= 2) {
      const filtered = equipmentSuggestions
        .filter(suggestion => 
          suggestion.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 6);
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, []);

  // Handle search submission
  const handleSearch = useCallback((query: string = inputValue) => {
    if (!query.trim()) return;
    
    saveToHistory(query);
    onSearch(query);
    setIsOpen(false);
    inputRef.current?.blur();
  }, [inputValue, onSearch, saveToHistory]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    handleSearch(suggestion);
  }, [handleSearch]);

  // Clear search
  const handleClear = useCallback(() => {
    setInputValue('');
    onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  }, []);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [handleSearch]);

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="relative"
      >
        <div className="flex items-center bg-card/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 hover:border-white/20 transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="text-muted-foreground mr-3 flex-shrink-0" size={20} />
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="bg-transparent border-none outline-none flex-1 text-foreground placeholder:text-muted-foreground p-0 h-auto focus-visible:ring-0 text-base"
          />
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="p-1 h-auto hover:bg-white/10 ml-2 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </form>

      {/* Search Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 z-50"
        >
          <Card className="p-0 max-h-96 overflow-hidden shadow-2xl bg-card/95 backdrop-blur-xl border-white/10">
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {inputValue.length >= 2 ? (
                // Search Suggestions
                <div className="p-4">
                  {filteredSuggestions.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          Suggestions
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {filteredSuggestions.length}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {filteredSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-lg transition-all duration-150 flex items-center group"
                          >
                            <Search size={16} className="text-muted-foreground mr-3 group-hover:text-primary transition-colors" />
                            <span className="text-foreground font-medium">
                              {suggestion.toLowerCase().includes(inputValue.toLowerCase()) ? (
                                <>
                                  {suggestion.split(new RegExp(`(${inputValue})`, 'gi')).map((part, i) => 
                                    part.toLowerCase() === inputValue.toLowerCase() ? (
                                      <span key={i} className="text-primary font-semibold">{part}</span>
                                    ) : (
                                      <span key={i}>{part}</span>
                                    )
                                  )}
                                </>
                              ) : (
                                suggestion
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search size={28} className="mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No suggestions found</p>
                      <p className="text-xs mt-1 opacity-60">Try different keywords</p>
                    </div>
                  )}
                </div>
              ) : (
                // Recent Searches and Popular Searches
                <div className="p-4 space-y-6">
                  {/* Recent Searches */}
                  {searchHistory.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Clock size={16} className="text-muted-foreground mr-2" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Recent Searches
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearHistory}
                          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 h-auto"
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {searchHistory.slice(0, 5).map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(item.query)}
                            className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg transition-all duration-150 flex items-center group"
                          >
                            <Clock size={14} className="text-muted-foreground mr-3 group-hover:text-primary transition-colors" />
                            <span className="text-foreground">{item.query}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Searches */}
                  <div>
                    <div className="flex items-center mb-3">
                      <TrendingUp size={16} className="text-muted-foreground mr-2" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Popular Searches
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {popularSearches.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(item.query)}
                          className="text-left px-3 py-2 hover:bg-white/5 rounded-lg transition-all duration-150 flex items-center justify-between group"
                        >
                          <div className="flex items-center">
                            <TrendingUp size={14} className="text-muted-foreground mr-3 group-hover:text-primary transition-colors" />
                            <span className="text-foreground">{item.query}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.count}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}