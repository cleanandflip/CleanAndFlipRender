/**
 * Step 3: Summary and Completion
 * Reviews user information and completes onboarding using SSOT system
 */

import { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight, MapPin, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

interface StepSummaryProps {
  onComplete: () => void;
  currentStep: number;
  completedSteps: number[];
}

const StepSummary = ({ onComplete }: StepSummaryProps) => {
  const [profileData, setProfileData] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user's current address
  const { data: addresses = [] } = useQuery({
    queryKey: ['/api/addresses'],
    enabled: !!user
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          profileComplete: true,
          onboardingStep: 3,
          onboarded: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete onboarding');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile completed!",
        description: "Welcome to Clean & Flip! You can now browse and purchase equipment.",
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const primaryAddress = addresses.find((addr: any) => addr.isDefault) || addresses[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Review Your Profile
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Make sure everything looks correct before completing your setup
        </p>
      </div>

      {/* Profile Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        {/* Personal Info */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Personal Information</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.email || 'No name provided'
              }
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Delivery Address</h3>
            {primaryAddress ? (
              <div className="text-gray-600 dark:text-gray-400">
                <p>{primaryAddress.street1}</p>
                {primaryAddress.street2 && <p>{primaryAddress.street2}</p>}
                <p>{primaryAddress.city}, {primaryAddress.state} {primaryAddress.postalCode}</p>
                {primaryAddress.isLocal && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mt-1">
                    Local delivery available
                  </span>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-500">No address provided</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Phone Number</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.phone || 'No phone number provided'}
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">What's next?</h3>
        <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
          <li>• Browse our equipment catalog</li>
          <li>• Add items to your cart</li>
          <li>• Enjoy local delivery if eligible</li>
          <li>• Manage your orders in your dashboard</li>
        </ul>
      </div>

      {/* Complete Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => completeOnboardingMutation.mutate()}
          disabled={completeOnboardingMutation.isPending}
          size="lg"
          className="px-8"
          data-testid="button-complete"
        >
          {completeOnboardingMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Completing...
            </>
          ) : (
            <>
              Complete Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepSummary;
