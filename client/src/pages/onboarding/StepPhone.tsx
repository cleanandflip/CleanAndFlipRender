/**
 * Step 2: Phone Number Collection (NO SMS options)
 * Strict validation with libphonenumber-js (US default)
 */

import { useState, useEffect } from 'react';
import { Phone, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

interface StepPhoneProps {
  onNext: (phone: string) => void;
  onBack: () => void;
  initialData?: string;
  isLoading?: boolean;
}

const StepPhone = ({ onNext, onBack, initialData, isLoading = false }: StepPhoneProps) => {
  const [phone, setPhone] = useState(initialData || '');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    validatePhone(phone);
  }, [phone]);

  const validatePhone = (value: string) => {
    setError('');
    
    if (!value.trim()) {
      setIsValid(false);
      setFormattedPhone('');
      return;
    }

    // Block obvious invalid patterns
    if (/[a-zA-Z]/.test(value)) {
      setError('Phone numbers cannot contain letters');
      setIsValid(false);
      setFormattedPhone('');
      return;
    }

    if (/^[0-9]$/.test(value)) {
      setError('Please enter a complete phone number');
      setIsValid(false);
      setFormattedPhone('');
      return;
    }

    try {
      // Parse with US as default country
      const phoneNumber = parsePhoneNumber(value, 'US');
      
      if (phoneNumber && phoneNumber.isValid()) {
        const formatted = phoneNumber.formatNational();
        setFormattedPhone(formatted);
        setIsValid(true);
      } else {
        // Check if it's a valid number for any country
        const isValidAnyCountry = isValidPhoneNumber(value);
        if (isValidAnyCountry) {
          const phoneNumber = parsePhoneNumber(value);
          if (phoneNumber) {
            setFormattedPhone(phoneNumber.formatInternational());
            setIsValid(true);
          }
        } else {
          setError('Please enter a valid phone number');
          setIsValid(false);
          setFormattedPhone('');
        }
      }
    } catch (err) {
      setError('Please enter a valid phone number');
      setIsValid(false);
      setFormattedPhone('');
    }
  };

  const handleNext = () => {
    if (isValid && phone.trim()) {
      // Use the original input for storage, formatted version for display
      onNext(phone.trim());
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          How can we reach you?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We'll use your phone number for order updates and delivery coordination
        </p>
      </div>

      {/* Phone Input */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={handlePhoneChange}
            className={`text-lg ${error ? 'border-red-500' : ''} ${isValid ? 'border-green-500' : ''}`}
            disabled={isLoading}
            data-testid="input-phone"
          />
          
          {formattedPhone && (
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ {formattedPhone}
            </p>
          )}
          
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Why we need this */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Why we need your phone number:
          </h3>
          <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
            <li>• Order confirmation and status updates</li>
            <li>• Delivery scheduling and coordination</li>
            <li>• Equipment pickup arrangements</li>
            <li>• Account security verification</li>
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Address
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!isValid || isLoading}
          className="flex-1"
          data-testid="button-continue"
        >
          Continue to Summary
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default StepPhone;