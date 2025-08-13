/**
 * NEW ONBOARDING SYSTEM - Complete Rebuild on SSOT Address System
 * 3-step flow: Address -> Phone -> Summary (no SMS)
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ShoppingCart, MapPin, Phone, CheckCircle } from 'lucide-react';

import StepAddress from './StepAddress';
import StepPhone from './StepPhone';
import StepSummary from './StepSummary';

interface OnboardingData {
  address?: any;
  phone?: string;
}

const OnboardingFlow = () => {
  const { user, refetch } = useAuth();
  const [location, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({});
  const [isLoading, setIsLoading] = useState(false);

  // Check if user needs onboarding
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // If already completed, redirect appropriately
    if (user.profileComplete) {
      const urlParams = new URLSearchParams(window.location.search);
      const fromPath = urlParams.get('from');
      navigate(fromPath === 'cart' ? '/cart' : '/dashboard');
      return;
    }
  }, [user, navigate]);

  const handleStepComplete = async (stepData: any, step: number) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    if (step < 3) {
      setCurrentStep(step + 1);
    } else {
      // Complete onboarding
      await completeOnboarding(updatedData);
    }
  };

  const completeOnboarding = async (data: OnboardingData) => {
    setIsLoading(true);
    try {
      // Step 1: Create address via SSOT API
      if (data.address) {
        const addressResponse = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...data.address,
            setDefault: true
          })
        });

        if (!addressResponse.ok) {
          const error = await addressResponse.json();
          throw new Error(error.message || 'Failed to save address');
        }
      }

      // Step 2: Update user with phone and completion status
      const userResponse = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: data.phone,
          profileComplete: true,
          onboardingStep: 4
        })
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.message || 'Failed to complete onboarding');
      }

      // Refresh user data
      await refetch();
      
      toast({
        title: "Welcome to Clean & Flip!",
        description: "Your profile is complete. Start exploring our equipment exchange!",
      });

      // Redirect appropriately
      const urlParams = new URLSearchParams(window.location.search);
      const fromPath = urlParams.get('from');
      navigate(fromPath === 'cart' ? '/cart' : '/dashboard');

    } catch (error: any) {
      console.error('Onboarding completion error:', error);
      toast({
        title: "Setup Error",
        description: error.message || "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = (step: number) => {
    const icons = [MapPin, Phone, CheckCircle];
    const Icon = icons[step - 1];
    return <Icon className="w-5 h-5" />;
  };

  const getStepTitle = (step: number) => {
    const titles = ['Your Address', 'Phone Number', 'Complete Setup'];
    return titles[step - 1];
  };

  if (!user || user.profileComplete) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Clean & Flip
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Complete your profile to start exchanging fitness equipment
          </p>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="flex items-center gap-2">
                {getStepIcon(currentStep)}
                {getStepTitle(currentStep)}
              </CardTitle>
              <span className="text-sm text-gray-500">
                Step {currentStep} of 3
              </span>
            </div>
            <Progress value={(currentStep / 3) * 100} className="w-full" />
          </CardHeader>

          <CardContent>
            {currentStep === 1 && (
              <StepAddress
                onNext={(data) => handleStepComplete({ address: data }, 1)}
                initialData={formData.address}
                isLoading={isLoading}
              />
            )}
            
            {currentStep === 2 && (
              <StepPhone
                onNext={(data) => handleStepComplete({ phone: data }, 2)}
                onBack={() => setCurrentStep(1)}
                initialData={formData.phone}
                isLoading={isLoading}
              />
            )}
            
            {currentStep === 3 && (
              <StepSummary
                onNext={() => handleStepComplete({}, 3)}
                onBack={() => setCurrentStep(2)}
                data={formData}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          Need help? Contact our support team
        </p>
      </div>
    </div>
  );
};

export default OnboardingFlow;