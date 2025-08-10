import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce input for API calls
  const debouncedInput = useDebounce(input, 500);
  
  // Reset justSelected flag after selection
  useEffect(() => {
    if (justSelected) {
      const timer = setTimeout(() => {
        setJustSelected(false);
      }, 1000);
      return () => clearTimeout(timer);
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
    
    const fetchSuggestions = async () => {
      setIsLoading(true);
      
      try {
        // API key handled server-side in proxy now
        console.log('🔑 Using server-side proxy for GEOApify API');
        
        console.log('🔍 Searching for:', debouncedInput);
        
        // Use backend proxy to avoid CORS issues
        const url = `/api/geocode/autocomplete?text=${encodeURIComponent(debouncedInput)}`;
        console.log('🌐 Proxy API URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 Response status:', response.status);
        
        console.log('📡 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          type: response.type
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📦 Raw API data:', data);
          
          if (data.results && Array.isArray(data.results)) {
            const parsed = data.results.map((result: any) => ({
              formatted: result.formatted,
              street: result.housenumber ? `${result.housenumber} ${result.street}` : result.street || result.name || result.address_line1,
              city: result.city || result.county,
              state: result.state_code || result.state,
              zipCode: result.postcode
            }));
            
            console.log('✅ Parsed suggestions:', parsed);
            setSuggestions(parsed);
            setShowDropdown(parsed.length > 0);
          } else {
            console.warn('⚠️ No results in API response:', data);
            setSuggestions([]);
            setShowDropdown(false);
          }
        } else {
          const errorText = await response.text();
          console.error('❌ API Error:', response.status, response.statusText, errorText);
        }
      } catch (error) {
        console.error('🚫 Address search failed:', error);
        console.error('🔍 Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown',
          toString: error?.toString(),
          apiKey: !!apiKey,
          searchTerm: debouncedInput,
          errorType: typeof error
        });
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedInput, justSelected]);
  
  // Handle address selection
  const handleSelect = (suggestion: any) => {
    console.log('🎯 Selected suggestion:', suggestion);
    
    const addressData: AddressData = {
      street: suggestion.street || '',
      city: suggestion.city || '',
      state: suggestion.state || '',
      zipCode: suggestion.zipCode || ''
    };
    
    // Update input with just the street address (not full formatted)
    setInput(suggestion.street || '');
    
    // Mark that we just selected to prevent re-searching
    setJustSelected(true);
    
    // Close dropdown immediately
    setShowDropdown(false);
    setSuggestions([]);
    
    // Send data to parent
    onAddressSelect(addressData);
    
    console.log('🎉 Address selection complete!');
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
    setInput(e.target.value);
    // Only reset flag if user is manually typing (not from address selection)
    if (!justSelected) {
      setJustSelected(false);
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
          className={`w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
        
        {/* Loading spinner on the right */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-auto">
          {suggestions.map((suggestion: any, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-blue-600 hover:text-white transition-colors border-b border-gray-600 last:border-0 focus:outline-none focus:bg-blue-600"
            >
              <div className="font-medium">{suggestion.street}</div>
              <div className="text-xs text-gray-300 mt-1">{suggestion.city}, {suggestion.state} {suggestion.zipCode}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}