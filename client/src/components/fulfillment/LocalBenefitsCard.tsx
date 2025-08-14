import React from 'react';
import { Clock, Package2, Recycle, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LocalBenefitsCardProps {
  variant: 'grid' | 'pdp' | 'checkout';
  className?: string;
}

export function LocalBenefitsCard({ variant, className = '' }: LocalBenefitsCardProps) {
  const benefits = [
    {
      icon: Clock,
      text: "24–48 hr delivery window"
    },
    {
      icon: Package2,
      text: "Heavy item handling"
    },
    {
      icon: Recycle,
      text: "No packaging waste"
    },
    {
      icon: Users,
      text: "Local support"
    }
  ];

  const isCompact = variant === 'grid';
  
  return (
    <Card className={`${className} ${isCompact ? 'p-3' : 'p-4'}`}>
      <CardContent className="p-0">
        <h3 className={`font-semibold mb-3 text-green-800 dark:text-green-200 ${
          isCompact ? 'text-sm' : 'text-base'
        }`}>
          Local Delivery Benefits
        </h3>
        <div className={`space-y-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="flex items-center gap-2">
                <Icon 
                  className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-green-600 dark:text-green-400 flex-shrink-0`} 
                  aria-hidden="true" 
                />
                <span className="text-gray-700 dark:text-gray-300">{benefit.text}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default LocalBenefitsCard;