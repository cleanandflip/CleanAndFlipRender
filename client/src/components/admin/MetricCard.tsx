import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend,
  subtitle, 
  className = '' 
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-text-muted-foreground';
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <Card className={`glass p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2 text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
      </div>
      
      {change !== undefined && (
        <div className="flex items-center gap-2 mt-4">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {Math.abs(change)}%
          </span>
          <span className="text-xs text-text-muted-foreground">from last period</span>
        </div>
      )}
    </Card>
  );
}