import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import { toast } from '@/hooks/use-toast';

const OnboardingPage = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('onboarding_progress');
    return saved ? JSON.parse(saved) : {};
  });

  // Only Google OAuth users need onboarding
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Non-Google users skip onboarding
    if (user.authProvider !== 'google') {
      navigate('/dashboard');
      return;
    }
    
    // Already completed
    if (user.profileComplete) {
      navigate('/dashboard');
      return;
    }
    
    // Resume from saved step
    if (user.onboardingStep && user.onboardingStep > 0) {
      setCurrentStep(user.onboardingStep);
    }
  }, [user, navigate]);

  // Save progress on every update
  useEffect(() => {
    localStorage.setItem('onboarding_progress', JSON.stringify(formData));
  }, [formData]);

  const completeOnboarding = async () => {
    try {
      const response = await fetch('/api/auth/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          address: formData.address,
          phone: formData.phone,
          preferences: formData.preferences
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        localStorage.removeItem('onboarding_progress');
        
        if (result.isLocalCustomer) {
          toast({
            title: "Welcome!",
            description: "You qualify for free local pickup in Asheville!",
          });
        }
        
        // Refresh will happen automatically
        navigate(result.redirectUrl || '/dashboard');
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || 'Failed to complete onboarding',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: 'Please try again.',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-600">{Math.round((currentStep / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {currentStep === 1 && (
            <AddressForm 
              onNext={(data: any) => {
                setFormData({ ...formData, address: data });
                setCurrentStep(2);
              }}
              initialData={formData.address}
            />
          )}
          
          {currentStep === 2 && (
            <ContactForm 
              onNext={(data: any) => {
                setFormData({ ...formData, phone: data });
                setCurrentStep(3);
              }}
              onBack={() => setCurrentStep(1)}
              initialData={formData.phone}
            />
          )}
          
          {currentStep === 3 && (
            <PreferencesForm 
              onNext={(data: any) => {
                setFormData({ ...formData, preferences: data });
                completeOnboarding();
              }}
              onBack={() => setCurrentStep(2)}
              initialData={formData.preferences}
            />
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Google account users must complete profile to continue
        </p>
      </div>
    </div>
  );
};

// ADDRESS FORM WITH GEOAPIFY
const AddressForm = ({ onNext, initialData }: any) => {
  const [address, setAddress] = useState(initialData || {});
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState('');

  const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
  
  if (!GEOAPIFY_KEY) {
    console.error('CRITICAL: Add VITE_GEOAPIFY_API_KEY to .env file');
  }

  const searchAddress = async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?` +
        `text=${encodeURIComponent(text)}&` +
        `apiKey=${GEOAPIFY_KEY}&` +
        `limit=5&` +
        `filter=countrycode:us&` +
        `format=json`
      );

      if (!response.ok) throw new Error('Geoapify API error');

      const data = await response.json();
      
      const parsed = data.results?.map((result: any) => ({
        formatted: result.formatted,
        street: result.housenumber ? `${result.housenumber} ${result.street}` : result.street || result.name,
        city: result.city || result.county,
        state: result.state_code || result.state,
        zipCode: result.postcode,
        lat: result.lat,
        lon: result.lon
      })) || [];

      setSuggestions(parsed);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectAddress = (suggestion: any) => {
    setAddress({
      street: suggestion.street,
      city: suggestion.city,
      state: suggestion.state,
      zipCode: suggestion.zipCode,
      latitude: suggestion.lat,
      longitude: suggestion.lon
    });
    setSuggestions([]);
    setSearchText(suggestion.formatted);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Where should we deliver?</h2>
      
      <div className="relative mb-4">
        <input
          type="text"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            searchAddress(e.target.value);
          }}
          placeholder="Start typing your address..."
          className="w-full p-3 border rounded-lg"
        />
        
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent" />
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => selectAddress(suggestion)}
                className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-0"
              >
                {(suggestion as any).formatted}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={address.street || ''}
          onChange={(e) => setAddress({...address, street: e.target.value})}
          placeholder="Street Address"
          required
          className="w-full p-3 border rounded-lg"
        />
        
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={address.city || ''}
            onChange={(e) => setAddress({...address, city: e.target.value})}
            placeholder="City"
            required
            className="p-3 border rounded-lg"
          />
          
          <input
            type="text"
            value={address.state || ''}
            onChange={(e) => setAddress({...address, state: e.target.value.toUpperCase()})}
            placeholder="State"
            maxLength={2}
            required
            className="p-3 border rounded-lg"
          />
        </div>
        
        <input
          type="text"
          value={address.zipCode || ''}
          onChange={(e) => setAddress({...address, zipCode: e.target.value})}
          placeholder="ZIP Code"
          required
          className="w-full p-3 border rounded-lg"
        />
        
        <input
          type="text"
          value={address.apartment || ''}
          onChange={(e) => setAddress({...address, apartment: e.target.value})}
          placeholder="Apartment, suite, etc. (optional)"
          className="w-full p-3 border rounded-lg"
        />
      </div>

      <button
        onClick={() => onNext(address)}
        disabled={!address.street || !address.city || !address.state || !address.zipCode}
        className="w-full mt-6 bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
};

// CONTACT FORM
const ContactForm = ({ onNext, onBack, initialData }: any) => {
  const [phone, setPhone] = useState(initialData || '');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
      
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone Number"
        required
        className="w-full p-3 border rounded-lg mb-6"
      />
      
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg"
        >
          Back
        </button>
        <button
          onClick={() => onNext(phone)}
          disabled={!phone}
          className="flex-1 bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// PREFERENCES FORM
const PreferencesForm = ({ onNext, onBack, initialData }: any) => {
  const [preferences, setPreferences] = useState(initialData || {
    emailNotifications: true,
    smsNotifications: false
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Notification Preferences</h2>
      
      <div className="space-y-4 mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={preferences.emailNotifications}
            onChange={(e) => setPreferences({
              ...preferences,
              emailNotifications: e.target.checked
            })}
            className="mr-3"
          />
          Email notifications for orders and updates
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={preferences.smsNotifications}
            onChange={(e) => setPreferences({
              ...preferences,
              smsNotifications: e.target.checked
            })}
            className="mr-3"
          />
          SMS notifications for important updates
        </label>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg"
        >
          Back
        </button>
        <button
          onClick={() => onNext(preferences)}
          className="flex-1 bg-blue-600 text-white p-3 rounded-lg"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;