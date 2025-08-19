// UNIFIED METRIC CARD COMPONENT
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    label: string;
  };
  className?: string;
  valueClassName?: string;
  trend?: string;
  subtitle?: string;
}

export function UnifiedMetricCard({ 
  title, 
  value, 
  icon: Icon, 
  change,
  className,
  valueClassName,
  trend,
  subtitle
}: MetricCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl",
      "bg-[#1e293b]/50 border border-gray-800",
      "backdrop-blur p-6",
      "transition-all duration-300 hover:bg-[#1e293b]/70",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className={cn("text-3xl font-bold", valueClassName || "text-white")}>{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {change && (
            <p className="text-sm mt-2">
              <span className={cn(
                "font-medium",
                change.value >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {change.value >= 0 ? '+' : ''}{change.value}%
              </span>
              <span className="text-gray-500 ml-1">{change.label}</span>
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-white/5">
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
      </div>
    </div>
  );
}