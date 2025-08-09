// UNIFIED ANALYTICS TAB
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, ShoppingCart, DollarSign, BarChart3, Activity } from 'lucide-react';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AnalyticsTab() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    refetchInterval: 30000
  });

  const metrics = {
    revenue: { value: analyticsData?.totalRevenue || 0, change: 0 },
    orders: { value: analyticsData?.totalOrders || 0, change: 0 },
    conversion: { value: analyticsData?.conversionRate || 0, change: 0 },
    avgOrder: { value: analyticsData?.avgOrderValue || 0, change: 0 },
    users: { value: analyticsData?.totalUsers || 0, change: 0 },
    products: { value: analyticsData?.totalProducts || 0, change: 0 }
  };

  // Use real data from API
  const revenueData = analyticsData?.charts?.revenue || [];
  const topProducts = analyticsData?.topProducts || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <UnifiedMetricCard
          title="Total Revenue"
          value={`$${metrics.revenue.value.toLocaleString()}`}
          icon={DollarSign}
          change={{ value: metrics.revenue.change, label: 'from last period' }}
        />
        <UnifiedMetricCard
          title="Total Orders"
          value={metrics.orders.value}
          icon={ShoppingCart}
          change={{ value: metrics.orders.change, label: 'from last period' }}
        />
        <UnifiedMetricCard
          title="Conversion Rate"
          value={`${metrics.conversion.value}%`}
          icon={TrendingUp}
          change={{ value: metrics.conversion.change, label: 'from last period' }}
        />
        <UnifiedMetricCard
          title="Avg Order Value"
          value={`$${metrics.avgOrder.value}`}
          icon={Activity}
          change={{ value: metrics.avgOrder.change, label: 'from last period' }}
        />
        <UnifiedMetricCard
          title="Active Users"
          value={metrics.users.value}
          icon={Users}
          change={{ value: metrics.users.change, label: 'from last period' }}
        />
        <UnifiedMetricCard
          title="Total Products"
          value={metrics.products.value}
          icon={BarChart3}
          change={{ value: metrics.products.change, label: 'from last period' }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products - Show Zero State for No Sales */}
        <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Product Sales</h3>
            <span className="text-sm text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
              No orders yet
            </span>
          </div>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/50 rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-gray-500" />
              </div>
              <h4 className="text-lg font-medium text-gray-300 mb-2">No Sales Data Yet</h4>
              <p className="text-gray-400 max-w-md">
                Product sales will appear here once customers complete orders. Currently showing zero sales across all products.
              </p>
              <div className="mt-6 text-left bg-gray-800/30 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-300 mb-2">Product Views (for reference):</h5>
                {topProducts.length > 0 ? topProducts.map((product: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>{product.name}</span>
                    <span>{product.views || product.sales || 0} views</span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No product data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {(analyticsData?.recentActivity || []).length > 0 ? (
            analyticsData.recentActivity.map((activity: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800/50 last:border-0">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'order' ? 'bg-green-400' :
                    activity.type === 'user' ? 'bg-blue-400' :
                    activity.type === 'product' ? 'bg-yellow-400' :
                    'bg-purple-400'
                  }`}></div>
                  <div>
                    <p className="text-white">{activity.description}</p>
                    <p className="text-sm text-gray-400">{activity.type}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown'}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}