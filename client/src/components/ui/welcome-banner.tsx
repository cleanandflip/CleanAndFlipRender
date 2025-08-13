import { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';

export function ProfileNudge() {
  const [dismissed, setDismissed] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  // FIXED: Fetch user's addresses with correct API endpoint
  const { data: addressesResponse } = useQuery({
    queryKey: ['addresses'], 
    queryFn: async () => {
      const response = await fetch('/api/addresses', {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: 60000
  });
  
  // FIXED: Check ALL user addresses - default first, then any other addresses
  const addresses = addressesResponse?.data || addressesResponse || [];
  
  // Comprehensive address check: Look for default address first, then any address
  const hasDefaultAddress = Array.isArray(addresses) && addresses.some((addr: any) => addr.isDefault === true);
  const hasAnyAddress = Array.isArray(addresses) && addresses.length > 0;
  
  // Only show banner if user has NO addresses at all (not just no default)
  const shouldShow = isAuthenticated && !hasAnyAddress && !dismissed;
  
  if (!shouldShow) return null;
  
  return (
    <Card className="mx-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-blue-200 dark:border-blue-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Add Your Shipping Address
          </h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
            Add your shipping address to unlock checkout and see if you qualify for free local delivery.
          </p>
          <Button 
            size="sm" 
            onClick={() => window.location.href = '/addresses'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Address
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setDismissed(true)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

// Keep old export for backward compatibility during migration
export const WelcomeBanner = ProfileNudge;