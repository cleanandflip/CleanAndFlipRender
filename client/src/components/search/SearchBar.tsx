import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { getQuery, setQuery, subscribe } from '@/lib/searchService';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

export default function SearchBar({ 
  placeholder = "Search equipment...", 
  className = "",
  size = 'md',
  id = 'search-input'
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(localQuery, 300);

  // Sync with URL on mount and when URL changes
  useEffect(() => {
    const { q } = getQuery();
    setLocalQuery(q || '');
  }, []);

  // Subscribe to URL changes
  useEffect(() => {
    const unsubscribe = subscribe((params) => {
      setLocalQuery(params.q || '');
    });
    
    return unsubscribe;
  }, []);

  // Update URL when debounced query changes - null-safe version
  useEffect(() => {
    const { q: currentQ } = getQuery();
    const safeCurrentQ = typeof currentQ === 'string' ? currentQ : '';
    const safeDebouncedQuery = typeof debouncedQuery === 'string' ? debouncedQuery : '';
    
    if (safeDebouncedQuery !== safeCurrentQ) {
      setQuery({ q: safeDebouncedQuery || undefined, page: 1 });
    }
  }, [debouncedQuery]);

  const handleClear = () => {
    setLocalQuery('');
    setQuery({ q: undefined, page: 1 });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      // Force immediate update - null-safe version
      const safeLocalQuery = typeof localQuery === 'string' ? localQuery : '';
      const safeDebouncedQuery = typeof debouncedQuery === 'string' ? debouncedQuery : '';
      
      if (safeLocalQuery !== safeDebouncedQuery) {
        setQuery({ q: safeLocalQuery || undefined, page: 1 });
      }
    }
  };

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base', 
    lg: 'h-12 text-lg'
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          id={id}
          data-search-input
          type="text"
          placeholder={placeholder}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "pl-10 pr-10 transition-all duration-200",
            sizeClasses[size],
            isFocused && "ring-2 ring-blue-500 ring-opacity-50"
          )}
        />
        {localQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}