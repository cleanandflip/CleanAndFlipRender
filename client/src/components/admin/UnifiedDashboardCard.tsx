import React from 'react';

interface UnifiedDashboardCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink';
  onClick?: () => void;
}

export function UnifiedDashboardCard({ 
  children, 
  className = '', 
  gradient = 'blue',
  onClick 
}: UnifiedDashboardCardProps) {
  
  const gradientStyles = {
    blue: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)',
    green: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
    purple: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
    orange: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%)',
    cyan: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(8, 145, 178, 0.1) 100%)',
    pink: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.1) 100%)'
  };

  const borderColors = {
    blue: 'rgba(59, 130, 246, 0.3)',
    green: 'rgba(16, 185, 129, 0.3)',
    purple: 'rgba(139, 92, 246, 0.3)',
    orange: 'rgba(249, 115, 22, 0.3)',
    cyan: 'rgba(6, 182, 212, 0.3)',
    pink: 'rgba(236, 72, 153, 0.3)'
  };

  return (
    <div
      className={`rounded-xl border p-6 transition-all duration-300 hover:scale-105 ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{
        background: gradientStyles[gradient],
        borderColor: borderColors[gradient],
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      {children}
    </div>
  );
}