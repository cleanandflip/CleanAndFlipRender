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
  onComplete: () => void;
  currentStep: number;
  completedSteps: number[];
}

const StepAddress = ({ onComplete }: StepAddressProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddressSuccess = async () => {
    setIsSubmitting(false);
    onComplete();
  };

  const handleAddressError = (error: any) => {
    setIsSubmitting(false);
    console.error('Address submission error:', error);
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
          onSuccess={handleAddressSuccess}
          onError={handleAddressError}
          setAsDefault={true}
          submitButtonText="Continue to Phone"
          submitButtonIcon={<ArrowRight className="w-4 h-4 ml-2" />}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default StepAddress;