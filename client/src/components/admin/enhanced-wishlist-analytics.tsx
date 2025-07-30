import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import GlassCard from "@/components/common/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Users, 
  TrendingUp, 
  Clock, 
  Eye, 
  Download, 
  ExternalLink,
  Lightbulb,
  AlertTriangle,
  Info,
  Sparkles
} from "lucide-react";

interface DetailedWishlistAnalytics {
  stats: {
    totalItems: number;
    itemsChange: number;
    activeUsers: number;
    usersChange: number;
    conversionRate: number;
    avgDaysInWishlist: number;
    powerUsers: number;
    activeWishlisters: number;
    casualUsers: number;
  };
  trendData: Array<{
    date: string;
    additions: number;
    removals: number;
    purchases: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    productImage: string;
    productPrice: number;
    wishlistCount: number;
    conversionRate: number;
  }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    email: string;
    itemCount: number;
    purchaseCount: number;
  }>;
  insights: Array<{
    title: string;
    description: string;
    action: string;
    type: 'opportunity' | 'warning' | 'info';
  }>;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}

function MetricCard({ title, value, change, subtitle, icon, trend }: MetricCardProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-blue/20 rounded-lg text-accent-blue">
            {icon}
          </div>
          <div>
            <p className="text-sm text-text-muted">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
          </div>
        </div>
        {change !== undefined && (
          <div className={`text-sm ${change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
        {trend && (
          <TrendingUp 
            className={`w-4 h-4 ${trend === 'up' ? 'text-green-400 rotate-0' : 'text-red-400 rotate-180'}`} 
          />
        )}
      </div>
    </GlassCard>
  );
}

function ProgressBar({ label, value, total, color = 'blue' }: { 
  label: string; 
  value: number; 
  total: number; 
  color?: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorClass = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500'
  }[color];

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-32 bg-gray-700 rounded-full h-2">
          <div 
            className={`${colorClass} h-2 rounded-full transition-all duration-300`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-white min-w-[2rem] text-right">{value}</span>
      </div>
    </div>
  );
}

export default function EnhancedWishlistAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [sortBy, setSortBy] = useState('count');

  const { data: analytics, isLoading } = useQuery<DetailedWishlistAnalytics>({
    queryKey: ["/api/admin/wishlist-analytics/detailed", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/wishlist-analytics/detailed?timeRange=${timeRange}`, { 
        credentials: 'include' 
      });
      if (!response.ok) {
        throw new Error('Failed to fetch detailed wishlist analytics');
      }
      return response.json();
    },
    refetchInterval: 30000
  });

  const handleExport = async () => {
    const response = await fetch('/api/admin/wishlist-analytics/export?format=csv', {
      credentials: 'include'
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wishlist-analytics.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <GlassCard className="p-8 text-center">
        <Heart className="mx-auto mb-4 text-accent-blue" size={48} />
        <h3 className="text-lg font-semibold mb-2">No Wishlist Data</h3>
        <p className="text-text-muted">Enhanced analytics will appear here once users start saving items.</p>
      </GlassCard>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Sparkles className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info': return <Info className="w-5 h-5 text-blue-400" />;
      default: return <Lightbulb className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Wishlist Analytics</h2>
        <div className="flex gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Wishlisted"
          value={analytics.stats.totalItems}
          change={analytics.stats.itemsChange}
          icon={<Heart className="w-6 h-6" />}
        />
        <MetricCard
          title="Active Users"
          value={analytics.stats.activeUsers}
          change={analytics.stats.usersChange}
          icon={<Users className="w-6 h-6" />}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${analytics.stats.conversionRate}%`}
          subtitle="Wishlist → Purchase"
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <MetricCard
          title="Avg Time in Wishlist"
          value={`${analytics.stats.avgDaysInWishlist}d`}
          subtitle="Before purchase/removal"
          icon={<Clock className="w-6 h-6" />}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Wishlisted Products */}
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Top Wishlisted Products</h3>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          
          <div className="space-y-3">
            {analytics.topProducts.map((product, index) => (
              <div key={product.productId} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                <span className="text-2xl font-bold text-gray-500">
                  #{index + 1}
                </span>
                
                <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                  {product.productImage ? (
                    <img 
                      src={product.productImage} 
                      alt={product.productName}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="text-2xl">📦</div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-white">{product.productName}</h4>
                  <p className="text-sm text-gray-400">${product.productPrice}</p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-white">{product.wishlistCount}</p>
                  <p className="text-xs text-gray-400">wishlists</p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-green-400">{product.conversionRate}%</p>
                  <p className="text-xs text-gray-400">conversion</p>
                </div>
                
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/admin/products/${product.productId}`}>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
        
        {/* User Engagement */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">User Wishlist Behavior</h3>
          
          {/* User Segments */}
          <div className="space-y-4 mb-6">
            <ProgressBar
              label="Power Users (10+ items)"
              value={analytics.stats.powerUsers}
              total={analytics.stats.activeUsers}
              color="blue"
            />
            <ProgressBar
              label="Active (5-9 items)"
              value={analytics.stats.activeWishlisters}
              total={analytics.stats.activeUsers}
              color="green"
            />
            <ProgressBar
              label="Casual (1-4 items)"
              value={analytics.stats.casualUsers}
              total={analytics.stats.activeUsers}
              color="yellow"
            />
          </div>
          
          {/* Top Users Table */}
          <h4 className="font-medium text-white mb-3">Most Active Users</h4>
          <div className="space-y-2">
            {analytics.topUsers.map(user => (
              <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">{user.userName}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{user.itemCount} items</p>
                  <p className="text-xs text-gray-400">
                    {user.purchaseCount} purchased
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Actionable Insights */}
      {analytics.insights && analytics.insights.length > 0 && (
        <GlassCard className="p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Insights & Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="flex gap-3">
                {getInsightIcon(insight.type)}
                <div>
                  <p className="font-medium text-white">{insight.title}</p>
                  <p className="text-sm text-gray-400">{insight.description}</p>
                  {insight.action && (
                    <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 p-0 h-auto mt-1">
                      {insight.action} →
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}