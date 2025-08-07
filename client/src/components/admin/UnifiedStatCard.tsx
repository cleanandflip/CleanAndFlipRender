import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedStatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  gradient?: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink';
  subtitle?: string;
}

const gradients = {
  blue: 'from-blue-600/90 to-blue-700/90 border-blue-500/30 hover:shadow-blue-500/20',
  green: 'from-green-600/90 to-green-700/90 border-green-500/30 hover:shadow-green-500/20',
  purple: 'from-purple-600/90 to-purple-700/90 border-purple-500/30 hover:shadow-purple-500/20',
  orange: 'from-orange-600/90 to-orange-700/90 border-orange-500/30 hover:shadow-orange-500/20',
  cyan: 'from-cyan-600/90 to-cyan-700/90 border-cyan-500/30 hover:shadow-cyan-500/20',
  pink: 'from-pink-600/90 to-pink-700/90 border-pink-500/30 hover:shadow-pink-500/20'
};

export function UnifiedStatCard({
  title,
  value,
  change,
  icon,
  gradient = 'blue',
  subtitle
}: UnifiedStatCardProps) {
  return (
    <div className={cn(
      "bg-gradient-to-br backdrop-blur-xl border rounded-xl p-6 shadow-2xl transition-all duration-300",
      gradients[gradient]
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
          {icon}
        </div>
        {typeof change === 'number' && (
          <div className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
            change >= 0 ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
          )}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-sm font-medium text-white/80 mb-1">{title}</div>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
      {subtitle && <div className="text-xs text-white/60 mt-2">{subtitle}</div>}
    </div>
  );
}