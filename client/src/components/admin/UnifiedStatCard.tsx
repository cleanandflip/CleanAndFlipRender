import React from 'react';

interface UnifiedStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  change?: number;
}

export function UnifiedStatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  gradient = 'blue',
  trend,
  change
}: UnifiedStatCardProps) {
  
  const gradientStyles = {
    blue: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(29, 78, 216, 0.15) 100%)',
    green: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
    purple: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
    orange: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.15) 100%)',
    cyan: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 145, 178, 0.15) 100%)',
    pink: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.15) 100%)'
  };

  const iconGradients = {
    blue: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    orange: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    cyan: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    pink: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
  };

  const borderColors = {
    blue: 'rgba(59, 130, 246, 0.4)',
    green: 'rgba(16, 185, 129, 0.4)',
    purple: 'rgba(139, 92, 246, 0.4)',
    orange: 'rgba(249, 115, 22, 0.4)',
    cyan: 'rgba(6, 182, 212, 0.4)',
    pink: 'rgba(236, 72, 153, 0.4)'
  };

  return (
    <div
      className="rounded-xl border p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
      style={{
        background: gradientStyles[gradient],
        borderColor: borderColors[gradient],
        backdropFilter: 'blur(15px)',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-300 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="p-3 rounded-lg"
            style={{
              background: iconGradients[gradient],
              boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)'
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}