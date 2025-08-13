import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

// SSOT Address interface for client-server communication
interface AddressData {
  firstName?: string;
  lastName?: string;
  street1: string;
  street2?: string;
  // SSOT: Only street1/street2 fields used
  city: string;
  state: string;
  zipCode: string; // Client field name
  postalCode: string; // Server field name
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressData) => void;
  value?: string;
  placeholder?: string;
  className?: string;
}

// Simple debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function AddressAutocomplete({ 
  onAddressSelect, 
  value = '', 
  placeholder = "Start typing your address...",
  className = ""
}: AddressAutocompleteProps) {
  const [input, setInput] = useState(value);
  
  // Update input when value prop changes (from parent)
  useEffect(() => {
    if (value !== input) {
      setInput(value);
    }
  }, [value]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce input for API calls
  const debouncedInput = useDebounce(input, 500);
  
  // Keep justSelected flag true longer and reset only when user manually types
  useEffect(() => {
    if (justSelected) {
      // Don't auto-reset - let user typing handle it
      return;
    }
  }, [justSelected]);

  // Fetch address suggestions
  useEffect(() => {
    // Don't search for short inputs or if just selected
    if (!debouncedInput || debouncedInput.length < 3 || justSelected) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Don't search if the debounced input matches what we just selected
    if (justSelected && debouncedInput === input) {
      return;
    }
    
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setApiError(null);
      
      try {
        // API key handled server-side in proxy now
        // Using server-side proxy for GEOApify API
        
        // Use backend proxy to avoid CORS issues
        const url = `/api/geocode/autocomplete?text=${encodeURIComponent(debouncedInput)}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.results && Array.isArray(data.results)) {
            const parsed = data.results.map((result: Record<string, string>) => ({
              formatted: result.formatted,
              street: result.housenumber ? `${result.housenumber} ${result.street}` : result.street || result.name || result.address_line1,
              city: result.city || result.county,
              state: result.state_code || result.state,
              zipCode: result.postcode
            }));
            
            setSuggestions(parsed);
            setShowDropdown(parsed.length > 0);
          } else {
            // No results found
            setSuggestions([]);
            setShowDropdown(false);
          }
        } else {
          // Handle specific API errors
          if (response.status === 429) {
            setApiError('Address suggestions temporarily unavailable. Please enter your address manually.');
          } else {
            setApiError('Address lookup unavailable. Please enter manually.');
          }
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('Address autocomplete error:', error);
        setApiError('Address lookup unavailable. Please enter manually.');
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedInput, justSelected]);
  
  // Handle address selection
  const handleSelect = (suggestion: { street?: string; city?: string; state?: string; zipCode?: string }) => {
    // Selected suggestion
    
    const addressData: AddressData = {
      street1: suggestion.street || '',
      // SSOT: Use street1 only
      city: suggestion.city || '',
      state: suggestion.state || '',
      zipCode: suggestion.zipCode || '', // Client field name
      postalCode: suggestion.zipCode || '', // Server field name
      country: 'US'
    };
    
    // Update input with just the street address (not full formatted)
    setInput(suggestion.street || '');
    
    // Mark that we just selected to prevent re-searching
    setJustSelected(true);
    
    // Close dropdown immediately and clear suggestions
    setShowDropdown(false);
    setSuggestions([]);
    
    // Prevent any further searches by clearing debounced value temporarily
    setTimeout(() => {
      setJustSelected(true);
    }, 50);
    
    // Send data to parent
    onAddressSelect(addressData);
    
    // Address selection complete
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const previousValue = input;
    setInput(newValue);
    
    // Only reset justSelected if user manually typed something different
    // (not just from our automatic setting)
    if (justSelected && newValue !== previousValue && newValue.length !== previousValue.length) {
      // User is manually typing - allow searches again
      setTimeout(() => setJustSelected(false), 100);
    }
  };
  
  // Handle input focus
  const handleFocus = () => {
    // Only show dropdown if we have suggestions and didn't just select
    if (suggestions.length > 0 && !justSelected) {
      setShowDropdown(true);
    }
  };
  
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        
        {/* Loading spinner on the right */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      
      {/* API Error Message */}
      {apiError && (
        <div className="mt-1 text-xs text-orange-400 bg-orange-400/10 border border-orange-400/20 rounded px-2 py-1">
          {apiError}
        </div>
      )}
      
      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-1 rounded-lg shadow-2xl max-h-60 overflow-auto"
          style={{ 
            backgroundColor: 'hsl(220, 14%, 12%)', // Dark navy matching theme
            border: '1px solid hsl(220, 13%, 18%)'
          }}
        >
          {suggestions.map((suggestion: { street?: string; city?: string; state?: string; zipCode?: string }, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-blue-600 hover:text-white transition-colors border-b border-gray-600 last:border-0 focus:outline-none focus:bg-blue-600"
              style={{ backgroundColor: 'hsl(220, 14%, 12%)' }}
            >
              <div className="font-semibold text-white">{suggestion.street}</div>
              <div className="text-xs text-gray-400 mt-1">{suggestion.city}, {suggestion.state} {suggestion.zipCode}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Add default export to fix import issues
export default AddressAutocomplete;