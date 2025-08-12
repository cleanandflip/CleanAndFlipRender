import * as React from "react";
import { searchService } from "@/lib/searchService";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  placeholder?: string;
  autoFocus?: boolean;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export default function SearchBar({ 
  placeholder = "Search equipment...", 
  autoFocus, 
  id = "search-input",
  size = 'md',
  className 
}: Props) {
  const [value, setValue] = React.useState<string>(searchService.getQuery().q);
  const flushRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    // keep input in sync with URL (back/forward, programmatic changes)
    return searchService.subscribe(() => setValue(searchService.getQuery().q));
  }, []);

  const commit = React.useCallback((next: string) => {
    // When clearing, also reset page to 1
    searchService.setQuery({ q: next, page: 1 });
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.currentTarget.value ?? "";
    setValue(next);
    // debounce 300ms
    if (flushRef.current) window.clearTimeout(flushRef.current);
    flushRef.current = window.setTimeout(() => commit(next), 300);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (flushRef.current) { window.clearTimeout(flushRef.current); flushRef.current = null; }
      commit(value);
    }
    if (e.key === "Escape") {
      setValue("");
      commit("");
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  const clear = () => { setValue(""); commit(""); };

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-5 text-lg'
  };

  return (
    <div role="search" className={cn("relative flex items-center", className)}>
      <div className="relative flex-1">
        <Search className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",
          size === 'sm' && "w-4 h-4",
          size === 'md' && "w-5 h-5", 
          size === 'lg' && "w-6 h-6"
        )} />
        <input
          id={id}
          data-search-input
          type="search"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Search products"
          className={cn(
            "w-full rounded-lg border border-gray-300 dark:border-gray-600",
            "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
            "pl-10 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
            "transition-colors duration-200",
            sizeClasses[size]
          )}
        />
        {value && (
          <button 
            type="button" 
            onClick={clear} 
            aria-label="Clear search"
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
              "transition-colors duration-200",
              size === 'sm' && "w-4 h-4",
              size === 'md' && "w-5 h-5",
              size === 'lg' && "w-6 h-6"
            )}
          >
            <X className="w-full h-full" />
          </button>
        )}
      </div>
    </div>
  );
}