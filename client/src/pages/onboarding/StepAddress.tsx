/**
 * Step 1: Address Collection using SSOT AddressForm
 * Integrates with the unified address system, no legacy fields
 */

import { useState } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddressForm } from '@/components/addresses/AddressForm';
import type { CreateAddressRequest } from '@/api/addresses';

interface StepAddressProps {
  onNext: (data: CreateAddressRequest) => void;
  initialData?: CreateAddressRequest;
  isLoading?: boolean;
}

const StepAddress = ({ onNext, initialData, isLoading = false }: StepAddressProps) => {
  const [addressData, setAddressData] = useState<CreateAddressRequest | null>(null);
  const [isValid, setIsValid] = useState(false);

  const handleAddressChange = (address: CreateAddressRequest, valid: boolean) => {
    setAddressData(address);
    setIsValid(valid);
  };

  const handleNext = () => {
    if (addressData && isValid) {
      onNext(addressData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Where should we deliver?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your address to check local delivery availability and calculate shipping
        </p>
      </div>

      {/* Address Form */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <AddressForm
          initialValues={initialData}
          onValidationChange={(valid, data) => handleAddressChange(data as CreateAddressRequest, valid)}
          showDefaultOption={false}
          submitButtonText="Continue to Phone"
          submitButtonIcon={<ArrowRight className="w-4 h-4 ml-2" />}
          onSubmit={handleNext}
          isLoading={isLoading}
          disabled={isLoading}
        />
      </div>

      {/* Benefits */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-600 dark:text-green-400 text-xs font-semibold">✓</span>
          </div>
          <div>
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-1">
              Local Delivery Available
            </h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Addresses within 50km of our warehouse qualify for free local delivery within 48 hours
            </p>
          </div>
        </div>
      </div>

      {/* Manual Option */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">
          Having trouble with address lookup?
        </p>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            // Could implement manual address entry fallback here
            console.log('Manual address entry requested');
          }}
          disabled={isLoading}
        >
          Enter address manually
        </Button>
      </div>
    </div>
  );
};

export default StepAddress;