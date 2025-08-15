// ADDITIVE: Auto-cleanup notification component for cart purges
import React from 'react';
import { AlertCircle, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface CartAutoCleanupNoticeProps {
  removedCount: number;
  onDismiss?: () => void;
}

export function CartAutoCleanupNotice({ removedCount, onDismiss }: CartAutoCleanupNoticeProps) {
  if (removedCount === 0) return null;

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Items removed from cart
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300 space-y-3">
        <p>
          We removed {removedCount} local-only item{removedCount !== 1 ? 's' : ''} because 
          your current address is outside our local delivery area.
        </p>
        <div className="flex gap-2">
          <Link to="/profile/addresses">
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-800">
              <MapPin className="w-4 h-4 mr-2" />
              Update Address
            </Button>
          </Link>
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss} className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-800">
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default CartAutoCleanupNotice;