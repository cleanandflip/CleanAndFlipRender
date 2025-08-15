import React from 'react';
import { CheckCircle, Info } from 'lucide-react';
import { useLocality } from '@/hooks/useLocality';
import { ZipCheck } from './ZipCheck';
import { Card } from '@/components/ui/card';

export function DeliveryEligibilityBanner() {
  // SSOT: Use unified locality hook for consistency
  const { data: locality, isLoading } = useLocality();
  const isLocal = locality?.eligible || false;

  if (isLoading) {
    return (
      <Card className="p-4 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse flex-1 max-w-md" />
        </div>
      </Card>
    );
  }

  if (isLocal) {
    return (
      <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
          <p className="text-green-800 dark:text-green-200 font-medium">
            Free local delivery in your area • Most orders arrive in 2–4 hrs
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-blue-800 dark:text-blue-200 font-medium mb-3">
            You're outside our local delivery area. Local-only items can't be added.
          </p>
          <ZipCheck onResolved={(isLocal) => {
            if (isLocal) {
              window.location.reload(); // Refresh to update locality state
            }
          }} />
        </div>
      </div>
    </Card>
  );
}

export default DeliveryEligibilityBanner;