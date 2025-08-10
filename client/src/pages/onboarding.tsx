import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';

const OnboardingPage = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('onboarding_progress');
    return saved ? JSON.parse(saved) : {};
  });

  // Handle onboarding for incomplete profiles
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Already completed - redirect based on where they came from
    if (user.profileComplete) {
      const urlParams = new URLSearchParams(window.location.search);
      const fromPath = urlParams.get('from');
      
      if (fromPath === 'cart') {
        navigate('/cart');
      } else {
        navigate('/dashboard');
      }
      return;
    }
    
    // Check URL params for specific step
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    
    if (stepParam) {
      const targetStep = parseInt(stepParam);
      if (targetStep >= 1 && targetStep <= 3) {
        setCurrentStep(targetStep);
      }
    } else if (user.onboardingStep && user.onboardingStep > 0) {
      // Resume from saved step
      setCurrentStep(user.onboardingStep);
    } else {
      // Determine starting step based on missing data
      let step = 1;
      if (!user.street || !user.city || !user.state || !user.zipCode) {
        step = 1; // Address step
      } else if (!user.phone) {
        step = 2; // Phone step  
      } else if (!user.profileComplete) {
        step = 3; // Preferences step
      }
      setCurrentStep(step);
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      localStorage.removeItem('onboarding_progress');
      
      if (result.isLocalCustomer) {
        toast({
          title: "Welcome!",
          description: "You qualify for free local pickup in Asheville!",
        });
      }
      
      // Check URL params to see if user came from cart
      const urlParams = new URLSearchParams(window.location.search);
      const fromCart = urlParams.get('from') === 'cart';
      
      if (fromCart) {
        // User came from cart, redirect them back to cart
        navigate('/cart');
      } else {
        // Normal onboarding flow
        navigate(result.redirectUrl || '/dashboard');
      }
    } catch (error: any) {
      console.error('Onboarding completion failed:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to complete onboarding',
        variant: "destructive",
      });
    }
  };

  // Check if user came from cart for contextual messaging
  const urlParams = new URLSearchParams(window.location.search);
  const fromCart = urlParams.get('from') === 'cart';

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Contextual message for users coming from protected pages */}
        {(fromCart || urlParams.get('from')) && (
          <div className="mb-6 p-4 bg-blue-950/50 border border-blue-800 rounded-lg">
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 text-blue-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-300">
                  {fromCart ? 'Complete Profile to Access Cart' : `Complete Profile to Continue`}
                </h3>
                <p className="text-sm text-blue-200 mt-1">
                  {currentStep === 1 && "We need your shipping address to calculate delivery costs and provide local pickup options."}
                  {currentStep === 2 && "Your phone number helps us contact you about orders and delivery updates."}
                  {currentStep === 3 && "Just a few final preferences to personalize your experience."}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-300">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-300">{Math.round((currentStep / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm p-8">
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

        <p className="text-center text-sm text-gray-400 mt-4">
          Complete your profile to continue shopping
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
      <h2 className="text-2xl font-bold mb-4 text-white">Where should we deliver?</h2>
      
      <div className="relative mb-4">
        <input
          type="text"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            searchAddress(e.target.value);
          }}
          placeholder="Start typing your address..."
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent" />
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => selectAddress(suggestion)}
                className="w-full text-left p-3 text-white hover:bg-gray-600 border-b border-gray-600 last:border-0 transition-colors"
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
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={address.city || ''}
            onChange={(e) => setAddress({...address, city: e.target.value})}
            placeholder="City"
            required
            className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          
          <input
            type="text"
            value={address.state || ''}
            onChange={(e) => setAddress({...address, state: e.target.value.toUpperCase()})}
            placeholder="State"
            maxLength={2}
            required
            className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        
        <input
          type="text"
          value={address.zipCode || ''}
          onChange={(e) => setAddress({...address, zipCode: e.target.value})}
          placeholder="ZIP Code"
          required
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        
        <input
          type="text"
          value={address.apartment || ''}
          onChange={(e) => setAddress({...address, apartment: e.target.value})}
          placeholder="Apartment, suite, etc. (optional)"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <button
        onClick={() => onNext(address)}
        disabled={!address.street || !address.city || !address.state || !address.zipCode}
        className="w-full mt-6 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <h2 className="text-2xl font-bold mb-4 text-white">Contact Information</h2>
      
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone Number"
        required
        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 mb-6"
      />
      
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white p-3 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onNext(phone)}
          disabled={!phone}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <h2 className="text-2xl font-bold mb-4 text-white">Notification Preferences</h2>
      
      <div className="space-y-4 mb-6">
        <label className="flex items-center text-gray-300">
          <input
            type="checkbox"
            checked={preferences.emailNotifications}
            onChange={(e) => setPreferences({
              ...preferences,
              emailNotifications: e.target.checked
            })}
            className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          Email notifications for orders and updates
        </label>
        
        <label className="flex items-center text-gray-300">
          <input
            type="checkbox"
            checked={preferences.smsNotifications}
            onChange={(e) => setPreferences({
              ...preferences,
              smsNotifications: e.target.checked
            })}
            className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          SMS notifications for important updates
        </label>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white p-3 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onNext(preferences)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;