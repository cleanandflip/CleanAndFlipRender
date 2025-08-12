import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';
import { globalDesignSystem as theme } from "@/styles/design-system/theme";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  onResultClick?: (result: any) => void;
  variant?: 'default' | 'hero' | 'navbar';
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({
  className,
  placeholder = "Search equipment...",
  onSearch,
  autoFocus = false
}: SearchBarProps) {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize search query from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q') || '';
    setSearchQuery(q);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (searchQuery.trim()) {
      urlParams.set('q', searchQuery.trim());
    } else {
      urlParams.delete('q');
    }
    
    const query = urlParams.toString();
    const newPath = `/products${query ? `?${query}` : ''}`;
    setLocation(newPath);
    
    if (onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete('q');
    const query = urlParams.toString();
    const newPath = `/products${query ? `?${query}` : ''}`;
    setLocation(newPath);
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className || ''}`}>
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          size={20}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-20 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            Clear
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}