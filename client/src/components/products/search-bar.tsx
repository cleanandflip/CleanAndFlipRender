import { useState, useRef, useEffect } from "react";
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
    
    if (newValue.length >= 2) {
      // Generate suggestions based on popular searches
      const filtered = popularSearches.filter(term => 
        term.toLowerCase().includes(newValue.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    console.log("Suggestion clicked:", suggestion);
    handleSearch(suggestion);
    
    // Update search history
    const updatedHistory = [suggestion, ...searchHistory.filter(h => h !== suggestion)].slice(0, 5);
    setSearchHistory(updatedHistory);
    localStorage.setItem("cleanflip-search-history", JSON.stringify(updatedHistory));
  };

  // Handle search
  const handleSearch = (query: string) => {
    console.log("handleSearch called with:", query);
    console.log("onSearch prop is:", onSearch);
    setInputValue(query);
    onChange?.(query);
    onSearch?.(query);
    setIsOpen(false);
  };

  // Handle form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleSearch(inputValue.trim());
    }
  };

  // Handle clear
  const handleClear = () => {
    setInputValue("");
    onChange?.("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`search-container ${className}`}>
      <form onSubmit={handleFormSubmit} className="relative">
        <Search className="search-icon" />
        <input
          ref={inputRef}
          type="search"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="search-input"
          autoComplete="off"
          spellCheck="false"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="search-clear"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div className="search-dropdown">
          {inputValue.length >= 2 ? (
            // Show suggestions when typing
            <div className="search-section">
              {suggestions.length > 0 ? (
                <>
                  <div className="search-section-title">
                    <Search size={16} />
                    Suggestions
                  </div>
                  <div className="search-items">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`suggestion-${index}`}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="search-item"
                      >
                        <Search size={16} />
                        <span className="search-highlight">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="search-empty">
                  <Search size={24} />
                  <p>No suggestions found</p>
                </div>
              )}
            </div>
          ) : (
            // Show history and popular searches when not typing
            <div>
              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    <Clock size={16} />
                    Recent Searches
                  </div>
                  <div className="search-items">
                    {searchHistory.map((term, index) => (
                      <button
                        key={`recent-${index}`}
                        type="button"
                        onClick={() => handleSuggestionClick(term)}
                        className="search-item"
                        onMouseDown={(e) => console.log("MouseDown on history:", term)}
                      >
                        <Clock size={16} />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div className="search-section">
                <div className="search-section-title">
                  <TrendingUp size={16} />
                  Popular Searches
                </div>
                <div className="search-items">
                  {popularSearches.slice(0, searchHistory.length > 0 ? 4 : 6).map((term, index) => (
                    <button
                      key={`popular-${index}`}
                      type="button"
                      onClick={() => handleSuggestionClick(term)}
                      className="search-item"
                      onMouseDown={(e) => console.log("MouseDown on popular:", term)}
                    >
                      <TrendingUp size={16} />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}