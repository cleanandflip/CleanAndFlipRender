import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface ParsedAddress {
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

interface AddressAutocompleteProps {
  value?: string;
  onChange?: (address: ParsedAddress) => void;
  onAddressSubmit?: (addressData: any) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
  name?: string;
  isLoading?: boolean;
  initialAddress?: any;
}

export default function AddressAutocomplete({
  value = '',
  onChange,
  onAddressSubmit,
  placeholder = "Start typing your address...",
  className,
  required,
  id,
  name,
  isLoading = false,
  initialAddress
}: AddressAutocompleteProps) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<ParsedAddress | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedInput = useDebounce(input, 300);

  // Geoapify API call
  useEffect(() => {
    if (debouncedInput.length < 3) {
      setSuggestions([]);
      return;
    }

    const searchAddresses = async () => {
      setLoading(true);
      try {
        const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
        if (!apiKey) {
          console.error('VITE_GEOAPIFY_API_KEY not found in environment variables');
          return;
        }

        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?` +
          `text=${encodeURIComponent(debouncedInput)}&` +
          `filter=countrycode:us&` +
          `format=json&` +
          `apiKey=${apiKey}`
        );
        
        const data = await response.json();
        setSuggestions(data.results || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    searchAddresses();
  }, [debouncedInput]);

  // Parse Geoapify response
  const parseAddress = (result: any): ParsedAddress => {
    // Extract components from Geoapify result
    const streetNumber = result.housenumber || '';
    const streetName = result.street || '';
    const street = `${streetNumber} ${streetName}`.trim();
    const city = result.city || result.town || result.village || '';
    const state = result.state_code || result.state || '';
    const zipCode = result.postcode || '';
    
    // Format: "123 Main St, Asheville, NC 28806"
    const fullAddress = `${street}, ${city}, ${state} ${zipCode}`.replace(/\s+/g, ' ').trim();
    
    return {
      street,
      city,
      state,
      zipCode,
      fullAddress,
      coordinates: {
        lat: result.lat,
        lng: result.lon
      }
    };
  };

  // Check if address is local to Asheville
  const isLocalCustomer = (address: ParsedAddress): boolean => {
    const ashevilleZips = [
      '28801', '28802', '28803', '28804', '28805', '28806',
      '28810', '28813', '28814', '28815', '28816'
    ];
    return ashevilleZips.includes(address.zipCode);
  };

  // Handle selection
  const selectAddress = (result: any) => {
    const parsed = parseAddress(result);
    setInput(parsed.fullAddress);
    setSelectedAddress(parsed);
    setShowDropdown(false);
    setSuggestions([]);
    
    // Call the appropriate callback
    if (onChange) {
      onChange(parsed);
    }
    
    if (onAddressSubmit) {
      onAddressSubmit({
        street: parsed.street,
        city: parsed.city,
        state: parsed.state,
        zipCode: parsed.zipCode,
        latitude: parsed.coordinates?.lat,
        longitude: parsed.coordinates?.lng
      });
    }
  };

  // Clear input
  const clearInput = () => {
    setInput('');
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedAddress(null);
    if (onChange) {
      onChange({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        fullAddress: ''
      });
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!e.target.value) clearInput();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          id={id}
          name={name}
          value={input}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={cn(
            "w-full px-3 py-3 bg-input border border-input",
            "text-input-foreground placeholder:text-white rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "transition-all duration-200",
            className
          )}
          autoComplete="off"
        />
        
        {/* Loading indicator */}
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
        )}
        
        {/* Clear button */}
        {!loading && input && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-input-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div 
          className="absolute z-[100] w-full mt-1 bg-popover border border-input rounded-lg shadow-2xl max-h-60 overflow-auto"
          style={{ top: '100%' }}
        >
          {suggestions.map((result, index) => {
            const parsed = parseAddress(result);
            return (
              <button
                key={result.place_id || index}
                type="button"
                onClick={() => selectAddress(result)}
                className="w-full px-4 py-3 text-left text-input-foreground hover:bg-accent focus:bg-accent focus:outline-none transition-colors border-b border-border last:border-0"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-input-foreground">
                      {parsed.street}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {parsed.city}, {parsed.state} {parsed.zipCode}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Local customer indicator */}
      {selectedAddress && isLocalCustomer(selectedAddress) && (
        <div className="mt-2 text-sm text-green-500 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Local pickup available in Asheville
        </div>
      )}
    </div>
  );
}