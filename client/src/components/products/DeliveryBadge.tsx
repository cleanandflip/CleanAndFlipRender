import { Truck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface DeliveryBadgeProps {
  className?: string;
}

export function DeliveryBadge({ className = '' }: DeliveryBadgeProps) {
  const { user } = useAuth();
  const isLocal = user?.isLocalCustomer;
  
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className={`inline-flex items-center space-x-1 text-xs ${isLocal ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
        <Truck className="h-3 w-3" />
        <span className={!isLocal ? 'line-through' : ''}>
          {isLocal ? 'FREE Delivery' : 'Free Delivery (Local Only)'}
        </span>
      </div>
      
      {!isLocal && (
        <span className="text-xs text-gray-500">
          + Shipping
        </span>
      )}
    </div>
  );
}