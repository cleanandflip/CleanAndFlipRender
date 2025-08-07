import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UnifiedDashboardCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  gradient?: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink';
  icon?: ReactNode;
  actions?: ReactNode;
}

const gradients = {
  blue: 'from-blue-600/90 to-blue-700/90 border-blue-500/30',
  green: 'from-green-600/90 to-green-700/90 border-green-500/30',
  purple: 'from-purple-600/90 to-purple-700/90 border-purple-500/30',
  orange: 'from-orange-600/90 to-orange-700/90 border-orange-500/30',
  cyan: 'from-cyan-600/90 to-cyan-700/90 border-cyan-500/30',
  pink: 'from-pink-600/90 to-pink-700/90 border-pink-500/30'
};

export function UnifiedDashboardCard({ 
  title, 
  children, 
  className = '', 
  gradient = 'blue',
  icon,
  actions 
}: UnifiedDashboardCardProps) {
  return (
    <div className={cn(
      "bg-gradient-to-br backdrop-blur-xl rounded-xl shadow-2xl transition-all duration-300 hover:shadow-lg",
      gradients[gradient],
      className
    )}>
      {title && (
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {icon && <div className="p-2 bg-white/10 rounded-lg">{icon}</div>}
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}