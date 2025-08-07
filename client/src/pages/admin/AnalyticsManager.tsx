import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UnifiedDashboardCard } from '@/components/admin/UnifiedDashboardCard';
import { UnifiedStatCard } from '@/components/admin/UnifiedStatCard';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users,
  Package,
  Download,
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react';
import { formatCurrency } from '@/utils/submissionHelpers';

interface AnalyticsData {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  conversionRate: number;
  conversionChange: number;
  avgOrderValue: number;
  aovChange: number;
  totalUsers: number;
  usersChange: number;
  totalProducts: number;
  productsChange: number;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  recentActivity: Array<{ id: string; type: string; description: string; timestamp: string }>;
}

export function AnalyticsManager() {
  const [dateRange, setDateRange] = useState('last30days');

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['admin-analytics', dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();

      // Ensure proper data structure with fallbacks
      return {
        totalRevenue: data.totalRevenue || 0,
        revenueChange: data.revenueChange || 0,
        totalOrders: data.totalOrders || 0,
        ordersChange: data.ordersChange || 0,
        conversionRate: data.conversionRate || 0,
        conversionChange: data.conversionChange || 0,
        avgOrderValue: data.avgOrderValue || 0,
        aovChange: data.aovChange || 0,
        totalUsers: data.totalUsers || 0,
        usersChange: data.usersChange || 0,
        totalProducts: data.totalProducts || 0,
        productsChange: data.productsChange || 0,
        topProducts: data.topProducts || [],
        recentActivity: data.recentActivity || []
      };
    },
    retry: 2
  });

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const res = await fetch(`/api/admin/analytics/export?format=${format}&range=${dateRange}`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const dateRangeOptions = [
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' },
    { value: 'last90days', label: 'Last 90 days' },
    { value: 'lastyear', label: 'Last year' }
  ];

  return (
    <div className="space-y-8">
      {/* PROFESSIONAL HEADER SECTION */}
      <UnifiedDashboardCard className="bg-gradient-to-r from-gray-800/50 to-gray-700/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Analytics Dashboard
            </h2>
            <p className="text-gray-400">Track your business performance and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => handleExport('csv')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </UnifiedDashboardCard>

      {/* KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UnifiedStatCard
          title="Total Revenue"
          value={formatCurrency(analytics?.totalRevenue || 0)}
          change={analytics?.revenueChange}
          icon={DollarSign}
          gradient="from-green-500 to-emerald-500"
        />
        <UnifiedStatCard
          title="Total Orders"
          value={(analytics?.totalOrders || 0).toLocaleString()}
          change={analytics?.ordersChange}
          icon={ShoppingCart}
          gradient="from-blue-500 to-cyan-500"
        />
        <UnifiedStatCard
          title="Conversion Rate"
          value={`${(analytics?.conversionRate || 0).toFixed(1)}%`}
          change={analytics?.conversionChange}
          icon={TrendingUp}
          gradient="from-purple-500 to-pink-500"
        />
        <UnifiedStatCard
          title="Avg Order Value"
          value={formatCurrency(analytics?.avgOrderValue || 0)}
          change={analytics?.aovChange}
          icon={DollarSign}
          gradient="from-orange-500 to-red-500"
        />
      </div>

      {/* SECONDARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UnifiedStatCard
          title="Total Users"
          value={(analytics?.totalUsers || 0).toLocaleString()}
          change={analytics?.usersChange}
          icon={Users}
          gradient="from-indigo-500 to-blue-500"
        />
        <UnifiedStatCard
          title="Total Products"
          value={(analytics?.totalProducts || 0).toLocaleString()}
          change={analytics?.productsChange}
          icon={Package}
          gradient="from-pink-500 to-purple-500"
        />
        <UnifiedStatCard
          title="Activity Score"
          value="98.5%"
          icon={Activity}
          gradient="from-teal-500 to-green-500"
        />
      </div>

      {/* CHARTS AND INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOP PRODUCTS */}
        <UnifiedDashboardCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Top Products</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics?.topProducts?.slice(0, 5).map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-gray-400 text-sm">{product.sales} sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No product data available</p>
              </div>
            )}
          </div>
        </UnifiedDashboardCard>

        {/* RECENT ACTIVITY */}
        <UnifiedDashboardCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics?.recentActivity?.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 animate-pulse" />
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.description}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </UnifiedDashboardCard>
      </div>

      {/* CHART PLACEHOLDER */}
      <UnifiedDashboardCard>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Revenue Trend</h3>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-800/30 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">Revenue Chart</h4>
            <p className="text-gray-400">Real-time analytics chart integration coming soon</p>
          </div>
        </div>
      </UnifiedDashboardCard>
    </div>
  );
}