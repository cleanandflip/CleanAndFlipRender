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
    revenue: { value: analyticsData?.totalRevenue || 0, change: 15 },
    orders: { value: analyticsData?.totalOrders || 0, change: 8 },
    conversion: { value: analyticsData?.conversionRate || 2.4, change: -2 },
    avgOrder: { value: analyticsData?.avgOrderValue || 0, change: 12 },
    users: { value: analyticsData?.totalUsers || 0, change: 5 },
    products: { value: analyticsData?.totalProducts || 0, change: 3 }
  };

  // Mock chart data - replace with real data from API
  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 4500 },
    { name: 'May', revenue: 6000 },
    { name: 'Jun', revenue: 5500 },
  ];

  const topProducts = [
    { name: 'Olympic Barbell', sales: 45 },
    { name: 'Adjustable Dumbbells', sales: 32 },
    { name: 'Power Rack', sales: 28 },
    { name: 'Weight Plates Set', sales: 24 },
  ];

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

        {/* Top Products */}
        <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Products</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
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
                <Bar dataKey="sales" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { type: 'order', message: 'New order placed', id: 'CF-2024-1001', time: '2 minutes ago' },
            { type: 'user', message: 'New user registered', id: 'john.doe@email.com', time: '5 minutes ago' },
            { type: 'product', message: 'Product updated', id: 'Olympic Barbell', time: '10 minutes ago' },
            { type: 'order', message: 'Order completed', id: 'CF-2024-1000', time: '15 minutes ago' },
            { type: 'review', message: 'New review posted', id: '5 stars on Power Rack', time: '20 minutes ago' },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800/50 last:border-0">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'order' ? 'bg-green-400' :
                  activity.type === 'user' ? 'bg-blue-400' :
                  activity.type === 'product' ? 'bg-yellow-400' :
                  'bg-purple-400'
                }`}></div>
                <div>
                  <p className="text-white">{activity.message}</p>
                  <p className="text-sm text-gray-400">{activity.id}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">{activity.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}