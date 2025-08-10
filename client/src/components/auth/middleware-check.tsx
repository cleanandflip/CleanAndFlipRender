import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function MiddlewareCheck() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && user) {
      // Check if user needs onboarding
      if (user.authProvider === 'google' && !user.profileComplete) {
        toast({
          title: "Complete Your Profile",
          description: "Let's finish setting up your account for local delivery",
        });
        navigate('/onboarding?step=' + (user.onboardingStep || 1));
      }
    }
  }, [user, isLoading, navigate, toast]);

  return null;
}