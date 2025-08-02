import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, X, Clock, TrendingUp } from "lucide-react";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ 
  value = "", 
  onChange, 
  onSearch,
  placeholder = "Search equipment...",
  className = ""
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Popular search terms
  const popularSearches = [
    "Olympic Barbell",
    "Weight Plates",
    "Power Rack",
    "Dumbbells",
    "Bench Press",
    "Squat Rack",
    "Bumper Plates",
    "Kettlebells"
  ];

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cleanflip-search-history");
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved).slice(0, 5)); // Keep only 5 most recent
      } catch (error) {
        console.error("Failed to parse search history:", error);
      }
    }
  }, []);

  // Handle input changes
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange?.(newValue);

    // Generate suggestions based on input
    if (newValue.length >= 2) {
      const filtered = popularSearches.filter(term =>
        term.toLowerCase().includes(newValue.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 6));
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(newValue.length === 0); // Show history when empty
    }
  };

  // Handle search submission
  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    
    // Save to search history
    const newHistory = [trimmedQuery, ...searchHistory.filter(h => h !== trimmedQuery)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem("cleanflip-search-history", JSON.stringify(newHistory));

    // Execute search
    onSearch?.(trimmedQuery);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(inputValue);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSearch(suggestion);
  };

  // Handle clear
  const handleClear = () => {
    setInputValue("");
    onChange?.("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="search-input flex items-center">
          <Search className="text-gray-400 mr-3 flex-shrink-0" size={18} />
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="bg-transparent border-none outline-none flex-1 text-white placeholder-gray-500 p-0 h-auto focus-visible:ring-0"
          />
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="p-1 h-auto hover:bg-white/10 ml-2"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-4 z-50 max-h-80 overflow-y-auto">
          {inputValue.length >= 2 ? (
            // Show suggestions when typing
            <div>
              {suggestions.length > 0 ? (
                <>
                  <div className="text-sm font-medium text-text-secondary mb-3">Suggestions</div>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center"
                      >
                        <Search size={14} className="text-gray-400 mr-3" />
                        <span className="text-primary">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-text-muted">
                  <Search size={24} className="mx-auto mb-2 opacity-50" />
                  <p>No suggestions found</p>
                </div>
              )}
            </div>
          ) : (
            // Show history and popular searches when not typing
            <div className="space-y-4">
              {/* Search History */}
              {searchHistory.length > 0 && (
                <div>
                  <div className="flex items-center text-sm font-medium text-text-secondary mb-3">
                    <Clock size={14} className="mr-2" />
                    Recent Searches
                  </div>
                  <div className="space-y-1">
                    {searchHistory.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(term)}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center"
                      >
                        <Clock size={14} className="text-gray-400 mr-3" />
                        <span className="text-primary">{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <div className="flex items-center text-sm font-medium text-text-secondary mb-3">
                  <TrendingUp size={14} className="mr-2" />
                  Popular Searches
                </div>
                <div className="space-y-1">
                  {popularSearches.slice(0, searchHistory.length > 0 ? 4 : 6).map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(term)}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center"
                    >
                      <TrendingUp size={14} className="text-gray-400 mr-3" />
                      <span className="text-primary">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
