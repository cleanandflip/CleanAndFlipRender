import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, User } from 'lucide-react';

export function ProfilePrompt() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Auto-redirect incomplete profiles to onboarding when they hit checkout
    if (user && !user.profileComplete) {
      const timer = setTimeout(() => {
        setLocation('/onboarding?checkout=true');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user, setLocation]);

  if (!user || user.profileComplete) {
    return null;
  }

  return (
    <Card className="p-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-full">
          <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
            Complete Your Profile
          </h3>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Please complete your profile to proceed with checkout. We need your shipping address and contact information.
          </p>
        </div>
        
        <Button 
          onClick={() => setLocation('/onboarding?checkout=true')}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <User className="h-4 w-4 mr-2" />
          Complete Profile
        </Button>
      </div>
      
      <div className="mt-4 text-xs text-orange-700 dark:text-orange-300">
        Redirecting automatically in 2 seconds...
      </div>
    </Card>
  );
}