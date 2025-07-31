import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, MapPin, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Using server-side proxy for MapTiler API (more secure)

// Rate limiting implementation for security
const rateLimiter = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 60;

function checkRateLimit(userId: string = 'anonymous'): boolean {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  rateLimiter.set(userId, [...recentRequests, now]);
  return true;
}

// Address result caching for performance
const addressCache = new Map<string, { data: AddressSuggestion[], time: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface AddressSuggestion {
  id: string;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context: Array<{ id: string; text: string }>;
}

interface AddressAutocompleteProps {
  value?: ParsedAddress | null;
  onChange: (address: ParsedAddress | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Start typing your address...",
  className,
  required = false,
  id,
  disabled = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value?.fullAddress || "");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search function
  const searchAddresses = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        setIsLoading(true);
        setError(null);

        // Check rate limit
        if (!checkRateLimit()) {
          throw new Error("Too many requests. Please wait a moment before searching again.");
        }

        // Check cache first
        const cached = addressCache.get(query);
        if (cached && Date.now() - cached.time < CACHE_DURATION) {
          setSuggestions(cached.data);
          setIsOpen(cached.data.length > 0);
          setSelectedIndex(-1);
          setIsLoading(false);
          return;
        }

        // API key validation now handled on server-side

        // Use server-side endpoint to avoid exposing API key on client
        const url = `/api/geocode?query=${encodeURIComponent(query)}`;
        
        const response = await fetch(url, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('MapTiler API Error:', response.status, errorText);
          throw new Error(`Address search failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('MapTiler response:', data);
        
        if (data.features && Array.isArray(data.features)) {
          const formattedSuggestions: AddressSuggestion[] = data.features.map((feature: any) => ({
            id: feature.id || Math.random().toString(),
            text: feature.text || "",
            place_name: feature.place_name || "",
            center: feature.center || [0, 0],
            context: feature.context || [],
          }));

          setSuggestions(formattedSuggestions);
          setIsOpen(formattedSuggestions.length > 0);
          setSelectedIndex(-1);
          
          // Cache the results
          addressCache.set(query, {
            data: formattedSuggestions,
            time: Date.now()
          });
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Address search error:", err);
          const errorMessage = err.message?.includes('API key') 
            ? "Address service temporarily unavailable" 
            : "Unable to search addresses. Please try again.";
          setError(errorMessage);
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue && inputValue !== value?.fullAddress) {
        searchAddresses(inputValue);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, searchAddresses, value?.fullAddress]);

  // Parse MapTiler response into our address format
  const parseAddress = (suggestion: AddressSuggestion): ParsedAddress => {
    const contexts = suggestion.context || [];
    
    // Extract components from context
    let street = suggestion.text || "";
    let city = "";
    let state = "";
    let zipCode = "";

    contexts.forEach((ctx) => {
      if (ctx.id.includes("place")) {
        city = ctx.text;
      } else if (ctx.id.includes("region")) {
        state = ctx.text;
      } else if (ctx.id.includes("postcode")) {
        zipCode = ctx.text;
      }
    });

    // If no street number, try to extract from place_name
    if (!street && suggestion.place_name) {
      const parts = suggestion.place_name.split(",");
      if (parts.length > 0) {
        street = parts[0].trim();
      }
    }

    return {
      street,
      city,
      state,
      zipCode,
      fullAddress: suggestion.place_name,
      coordinates: {
        lat: suggestion.center[1],
        lng: suggestion.center[0],
      },
    };
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    const parsedAddress = parseAddress(suggestion);
    setInputValue(parsedAddress.fullAddress);
    onChange(parsedAddress);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setInputValue("");
    onChange(null);
    setIsOpen(false);
    setSuggestions([]);
    setError(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update input when value prop changes
  useEffect(() => {
    if (value?.fullAddress !== inputValue) {
      setInputValue(value?.fullAddress || "");
    }
  }, [value]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 pr-12 bg-transparent border-0 rounded-lg",
            "text-white placeholder:text-text-muted focus:outline-none focus:ring-0 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          autoComplete="street-address"
        />

        {/* Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          )}
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-500 hover:text-white transition-colors"
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <MapPin className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={cn(
                "w-full px-4 py-3 text-left hover:bg-gray-800 focus:bg-gray-800 focus:outline-none cursor-pointer transition-colors",
                "flex items-start gap-3",
                index === selectedIndex && "bg-gray-800 text-blue-400"
              )}
            >
              <MapPin className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm font-medium truncate">
                  {suggestion.place_name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}