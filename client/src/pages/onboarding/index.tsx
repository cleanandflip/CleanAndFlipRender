/**
 * Main onboarding flow - orchestrates the 3-step process
 * Uses SSOT address system for clean, unified experience
 */

import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import StepAddress from "./StepAddress";
import StepPhone from "./StepPhone";
import StepSummary from "./StepSummary";

const STEPS = [
  { number: 1, title: "Address", component: StepAddress },
  { number: 2, title: "Phone", component: StepPhone },
  { number: 3, title: "Summary", component: StepSummary }
];

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [, params] = useRoute("/onboarding/:step?");
  
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Parse step from URL query parameter, not path segment
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const stepFromUrl = parseInt(urlParams.get('step') || '1');
    if (stepFromUrl >= 1 && stepFromUrl <= 3) {
      setCurrentStep(stepFromUrl);
    }
  }, [location]);

  // Check if user is already onboarded
  useEffect(() => {
    if (!isLoading && user?.onboarded) {
      const returnTo = new URLSearchParams(location.split('?')[1] || '').get('from');
      navigate(returnTo || '/dashboard');
    }
  }, [user, isLoading, location, navigate]);

  // Handle step completion
  const handleStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    
    if (step < 3) {
      const nextStep = step + 1;
      setCurrentStep(nextStep);
      const searchParams = new URLSearchParams();
      searchParams.set('step', nextStep.toString());
      const returnTo = new URLSearchParams(location.split('?')[1] || '').get('from');
      if (returnTo) searchParams.set('from', returnTo);
      navigate(`/onboarding?${searchParams.toString()}`);
    } else {
      // Final step completed - redirect based on source
      const returnTo = new URLSearchParams(location.split('?')[1] || '').get('from');
      navigate(returnTo || '/dashboard');
    }
  };

  // Handle navigation between steps
  const goToStep = (step: number) => {
    if (step <= Math.max(...completedSteps) + 1) {
      setCurrentStep(step);
      const searchParams = new URLSearchParams();
      searchParams.set('step', step.toString());
      const returnTo = new URLSearchParams(location.split('?')[1] || '').get('from');
      if (returnTo) searchParams.set('from', returnTo);
      navigate(`/onboarding?${searchParams.toString()}`);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {currentStep > 1 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={goBack}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="text-title">
                  Complete Your Profile
                </h1>
                <p className="text-gray-600" data-testid="text-subtitle">
                  Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <Progress value={progress} className="h-2" data-testid="progress-onboarding" />
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <CurrentStepComponent 
          onComplete={() => handleStepComplete(currentStep)}
          onStepChange={goToStep}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      </div>
    </div>
  );
}