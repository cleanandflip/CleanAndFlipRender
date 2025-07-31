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

  // Handle input changes with proper cleanup
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setError(null);
    
    if (newValue.length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      onChange({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        fullAddress: '',
        coordinates: { lat: 0, lng: 0 }
      });
    } else {
      setIsOpen(true);
    }
  };

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

  // State abbreviation helper
  const getStateAbbreviation = (stateName: string): string => {
    const stateMap: { [key: string]: string } = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    return stateMap[stateName] || stateName;
  };

  // Parse MapTiler response into clean address format
  const parseAddress = (suggestion: AddressSuggestion): ParsedAddress => {
    const contexts = suggestion.context || [];
    
    // Extract city name (not county) from context
    const city = contexts.find((c: any) => 
      c.id.includes('municipality') || c.id.includes('place')
    )?.text || '';
    
    // Extract state and convert to abbreviation
    const state = contexts.find((c: any) => 
      c.id.includes('region')
    )?.text || '';
    const stateAbbr = state.length > 2 ? getStateAbbreviation(state) : state;
    
    // Extract ZIP code
    const zipCode = contexts.find((c: any) => 
      c.id.includes('postal_code')
    )?.text || '';
    
    // Get street address
    const street = suggestion.text || suggestion.place_name?.split(',')[0]?.trim() || '';
    
    // Format: "123 Main St, Asheville, NC 28806" (no county, no country)
    const formattedAddress = [
      street,
      city,
      stateAbbr,
      zipCode
    ].filter(Boolean).join(', ');

    return {
      street,
      city,
      state: stateAbbr,
      zipCode,
      fullAddress: formattedAddress,
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
    setSuggestions([]); // Clear suggestions
    setIsOpen(false); // Hide dropdown
    setError(null);
    setSelectedIndex(-1);
    onChange({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      fullAddress: '',
      coordinates: { lat: 0, lng: 0 }
    });
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

  // Check if customer is local (Asheville, NC area)
  const isLocalCustomer = (address: ParsedAddress): boolean => {
    return address.city?.toLowerCase().includes('asheville') || 
           address.zipCode?.startsWith('288');
  };

  return (
    <div className={cn("relative w-full", className)} style={{ overflow: 'visible' }}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
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
            "w-full pl-3 pr-10 py-3 bg-transparent border-0 rounded-lg",
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
          className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
          style={{ 
            zIndex: 9999,
            position: 'absolute',
            top: '100%'
          }}
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

      {/* Local Customer Badge */}
      {value && value.fullAddress && isLocalCustomer(value) && (
        <div className="mt-2 text-sm text-green-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Local customer - Eligible for pickup in Asheville
        </div>
      )}
    </div>
  );
}