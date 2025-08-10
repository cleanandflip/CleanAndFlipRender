import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function WelcomeBanner() {
  const [location] = useLocation();
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    // Check URL parameters for Google OAuth onboarding
    const urlParams = new URLSearchParams(window.location.search);
    const google = urlParams.get('google');
    const isNew = urlParams.get('new');
    
    if (google === 'true' && isNew === 'true' && location.includes('/onboarding')) {
      setShow(true);
      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('google');
      url.searchParams.delete('new');
      window.history.replaceState({}, '', url.toString());
    }
  }, [location]);
  
  if (!show) return null;
  
  return (
    <Card className="mx-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-blue-200 dark:border-blue-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Welcome to Clean & Flip! 🏋️
          </h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Thanks for signing up with Google! Please complete your profile below so we can process orders and handle shipping.
            This information is required for all shopping functionality.
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShow(false)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}