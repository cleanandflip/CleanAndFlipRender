/**
 * Local Delivery Badge Component
 * Shows local delivery status as per comprehensive fix plan requirements
 */

import { Badge } from '@/components/ui/badge';
import { Truck, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import useLocalStatus from '@/hooks/useLocalStatus';

interface LocalDeliveryBadgeProps {
  productShippable?: boolean;
  className?: string;
  variant?: 'full' | 'compact';
}

export function LocalDeliveryBadge({ 
  productShippable = true, 
  className,
  variant = 'full' 
}: LocalDeliveryBadgeProps) {
  const { isLocal } = useLocalStatus();

  // Determine badge display logic per fix plan
  if (!productShippable && !isLocal) {
    // Red badge: Local pickup only but not in area
    return (
      <Badge 
        variant="destructive"
        className={cn("gap-1", className)}
      >
        <MapPin className="w-3 h-3" />
        {variant === 'full' ? 'Local Pickup Only (Not in your area)' : 'Pickup Only'}
      </Badge>
    );
  }

  if (!productShippable && isLocal) {
    // Green badge: Local pickup eligible
    return (
      <Badge 
        variant="default"
        className={cn("bg-green-600 hover:bg-green-700 gap-1", className)}
      >
        <MapPin className="w-3 h-3" />
        {variant === 'full' ? 'Local Pickup Eligible' : 'Pickup'}
      </Badge>
    );
  }

  if (productShippable && !isLocal) {
    // Blue badge: Ship eligible
    return (
      <Badge 
        variant="default"
        className={cn("bg-blue-600 hover:bg-blue-700 gap-1", className)}
      >
        <Truck className="w-3 h-3" />
        {variant === 'full' ? 'Ship Eligible' : 'Ship'}
      </Badge>
    );
  }

  if (productShippable && isLocal) {
    // Both available - show both as stacked pills
    return (
      <div className={cn("flex gap-1 flex-wrap", className)}>
        <Badge 
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 gap-1 text-xs"
        >
          <Truck className="w-3 h-3" />
          {variant === 'full' ? 'Ship' : 'Ship'}
        </Badge>
        <Badge 
          variant="default"
          className="bg-green-600 hover:bg-green-700 gap-1 text-xs"
        >
          <MapPin className="w-3 h-3" />
          {variant === 'full' ? 'Local Pickup' : 'Pickup'}
        </Badge>
      </div>
    );
  }

  return null;
}

export default LocalDeliveryBadge;