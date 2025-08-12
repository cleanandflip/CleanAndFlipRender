import * as React from "react";
import { Search as SearchIcon } from "lucide-react";
import { searchService } from "@/lib/searchService";

interface SearchBarProps {
  id?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  id = "search-bar",
  placeholder = "Search equipment...",
  size = "md",
  className = "",
  autoFocus = false
}: SearchBarProps) {
  const [value, setValue] = React.useState(() => searchService.getQuery().q);
  const flushRef = React.useRef<number>();

  // Keep input value synced with URL
  React.useEffect(() => {
    const unsubscribe = searchService.subscribe(() => {
      setValue(searchService.getQuery().q);
    });
    return unsubscribe;
  }, []);

  // Trigger re-render when busy changes for spinner
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    const unsubscribe = searchService.subscribeBusy(forceUpdate);
    return unsubscribe;
  }, []);

  const commit = React.useCallback((searchValue: string) => {
    const current = searchService.getQuery();
    searchService.setQuery({ 
      ...current, 
      q: searchValue.trim(), 
      page: 1 
    });
    searchService.setBusy(false);
  }, []);

  const onChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    
    // Clear any pending flush
    if (flushRef.current) {
      clearTimeout(flushRef.current);
    }

    // Set busy during debounce
    searchService.setBusy(true);

    // Debounced commit
    flushRef.current = window.setTimeout(() => {
      commit(next);
    }, 300);
  }, [commit]);

  const onKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (flushRef.current) {
        clearTimeout(flushRef.current);
      }
      commit(value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (flushRef.current) {
        clearTimeout(flushRef.current);
      }
      setValue("");
      commit("");
      (e.target as HTMLInputElement).blur();
    }
  }, [value, commit]);

  const clear = React.useCallback(() => {
    if (flushRef.current) {
      clearTimeout(flushRef.current);
    }
    setValue("");
    commit("");
  }, [commit]);

  return (
    // Container shrinks nicely in header rows, but is full-width on mobile
    <div className={`relative flex items-center w-full sm:w-auto ${className}`}>
      <div className="relative flex items-center w-full">
        {/* Leading icon */}
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon className="h-4 w-4 opacity-70" />
        </span>

        {/* Input */}
        <input
          id={id}
          type="search"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Search products"
          className={[
            // RESPONSIVE WIDTH
            "h-10 w-full sm:w-[min(46vw,520px)] md:w-[420px] lg:w-[520px]",
            // Padding to reserve icon + clear/spinner
            "pl-10 pr-10",
            // Shape/typography (match buttons height/rounding)
            "rounded-lg text-sm",
            // Theme styling
            "bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700",
            // Focus & transitions
            "focus:ring-2 focus:ring-blue-500/60 focus:border-transparent",
            "placeholder:opacity-70 transition-colors"
          ].join(" ")}
        />

        {/* Right-side cluster: spinner OR clear */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Loading spinner when busy */}
          {searchService.isBusy() && (
            <svg
              className="h-4 w-4 animate-spin opacity-80 text-blue-500"
              viewBox="0 0 24 24"
              aria-label="Searching"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>
          )}

          {/* Clear button (shows only if there's text) */}
          {value && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className="grid h-6 w-6 place-items-center rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500/60 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <span className="block leading-none text-base">×</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}