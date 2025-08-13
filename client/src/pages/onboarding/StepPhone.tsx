/**
 * Step 2: Phone Collection
 * Simple phone number input with validation
 */

import { useState } from 'react';
import { Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

interface StepPhoneProps {
  onComplete: () => void;
  currentStep: number;
  completedSteps: number[];
}

const StepPhone = ({ onComplete }: StepPhoneProps) => {
  const [phone, setPhone] = useState('');
  const [isValid, setIsValid] = useState(false);
  const { toast } = useToast();

  // Simple phone validation (US format)
  const validatePhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhone(value);
    setPhone(formatted);
    setIsValid(validatePhone(value));
  };

  const updatePhoneMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          phone: phoneNumber.replace(/\D/g, ''),
          onboardingStep: 2
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update phone number');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Phone number saved",
        description: "Your contact information has been updated successfully.",
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save phone number. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      updatePhoneMutation.mutate(phone);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Your phone number
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We'll use this to contact you about deliveries and order updates
        </p>
      </div>

      {/* Phone Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={handlePhoneChange}
                className={`mt-1 ${!isValid && phone ? 'border-red-300' : ''}`}
                data-testid="input-phone"
              />
              {!isValid && phone && (
                <p className="text-red-600 text-sm mt-1" data-testid="text-phone-error">
                  Please enter a valid 10-digit phone number
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isValid || updatePhoneMutation.isPending}
            data-testid="button-continue"
          >
            {updatePhoneMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                Continue to Summary
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Privacy note */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          We respect your privacy and will only use your phone number for order-related communications
        </p>
      </div>
    </div>
  );
};

export default StepPhone;