import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Calculator,
  Users,
  Package,
  CalendarIcon,
  Download
} from 'lucide-react';
import { formatCurrency } from '@/utils/submissionHelpers';
import { subDays } from 'date-fns';

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
  revenueData: Array<{ date: string; value: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  trafficSources: Array<{ source: string; users: number; percentage: number }>;
  recentActivity: Array<{ id: string; type: string; description: string; timestamp: string }>;
}

export function AnalyticsManager() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [metric, setMetric] = useState('revenue');
  const [groupBy, setGroupBy] = useState('day');

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['admin-analytics', 'last30days'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?range=last30days`, {
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
      const params = new URLSearchParams({
        format,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        metric
      });
      const res = await fetch(`/api/admin/analytics/export?${params}`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${metric}-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const quickDateRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last year', days: 365 }
  ];

  return (
    <DashboardLayout
      title="Analytics"
      description="Track your business performance and insights"
      totalCount={0}
      searchPlaceholder="Search metrics..."
      onSearch={() => {}}
      onRefresh={refetch}
      onExport={handleExport}
      isLoading={isLoading}
      filters={
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <div className="glass glass-hover rounded-lg p-1">
                <Button variant="ghost" className="gap-2 h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <CalendarIcon className="w-4 h-4" />
                  {dateRange.from && dateRange.to 
                    ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                    : 'Select date range'
                  }
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 themed-modal">
              <div className="p-3 space-y-2 border-b border-border">
                {quickDateRanges.map((range) => (
                  <Button
                    key={range.days}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setDateRange({
                      from: subDays(new Date(), range.days),
                      to: new Date()
                    })}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
              <Calendar
                mode="range"
                selected={dateRange as any}
                onSelect={(range) => {
                  if (range) {
                    setDateRange(range as any);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
              <SelectItem value="users">New Users</SelectItem>
              <SelectItem value="conversion">Conversion Rate</SelectItem>
              <SelectItem value="submissions">Submissions</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Hourly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="glass glass-hover rounded-lg p-1">
            <Button variant="ghost" className="gap-2 h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Download className="w-4 h-4" />
              Compare Period
            </Button>
          </div>
          
          <div className="glass glass-hover rounded-lg p-1">
            <Button 
              variant="ghost" 
              onClick={() => {
                setDateRange({
                  from: subDays(new Date(), 30),
                  to: new Date()
                });
                setMetric('revenue');
                setGroupBy('day');
              }}
              className="h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Reset
            </Button>
          </div>
        </div>
      }
    >
      {/* COMPLETELY REDESIGNED KEY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600/90 to-blue-700/90 backdrop-blur-md border border-blue-500/30 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            {analytics?.revenueChange !== undefined && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${analytics.revenueChange >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                <TrendingUp className="w-3 h-3" />
                {Math.abs(analytics.revenueChange).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-blue-100 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold text-white tracking-tight">${(analytics?.totalRevenue || 0).toFixed(2)}</div>
        </div>

        <div className="bg-gradient-to-br from-green-600/90 to-green-700/90 backdrop-blur-md border border-green-500/30 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            {analytics?.ordersChange !== undefined && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${analytics.ordersChange >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                <TrendingUp className="w-3 h-3" />
                {Math.abs(analytics.ordersChange).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-green-100 mb-1">Total Orders</div>
          <div className="text-3xl font-bold text-white tracking-tight">{(analytics?.totalOrders || 0).toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/90 to-purple-700/90 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            {analytics?.conversionChange !== undefined && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${analytics.conversionChange >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                <TrendingUp className="w-3 h-3" />
                {Math.abs(analytics.conversionChange).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-purple-100 mb-1">Conversion Rate</div>
          <div className="text-3xl font-bold text-white tracking-tight">{(analytics?.conversionRate || 0).toFixed(1)}%</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600/90 to-orange-700/90 backdrop-blur-md border border-orange-500/30 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            {analytics?.aovChange !== undefined && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${analytics.aovChange >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                <TrendingUp className="w-3 h-3" />
                {Math.abs(analytics.aovChange).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-orange-100 mb-1">Avg Order Value</div>
          <div className="text-3xl font-bold text-white tracking-tight">${(analytics?.avgOrderValue || 0).toFixed(2)}</div>
        </div>

        <div className="bg-gradient-to-br from-cyan-600/90 to-cyan-700/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Users className="w-6 h-6 text-white" />
            </div>
            {analytics?.usersChange !== undefined && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${analytics.usersChange >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                <TrendingUp className="w-3 h-3" />
                {Math.abs(analytics.usersChange).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-cyan-100 mb-1">Total Users</div>
          <div className="text-3xl font-bold text-white tracking-tight">{(analytics?.totalUsers || 0).toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-pink-600/90 to-pink-700/90 backdrop-blur-md border border-pink-500/30 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Package className="w-6 h-6 text-white" />
            </div>
            {analytics?.productsChange !== undefined && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${analytics.productsChange >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                <TrendingUp className="w-3 h-3" />
                {Math.abs(analytics.productsChange).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-pink-100 mb-1">Total Products</div>
          <div className="text-3xl font-bold text-white tracking-tight">{(analytics?.totalProducts || 0).toLocaleString()}</div>
        </div>
      </div>
      
      {/* PROFESSIONAL CHARTS AND ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Revenue Trend</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Revenue</span>
            </div>
          </div>
          {analytics?.revenueData && analytics.revenueData.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-2">
              {analytics.revenueData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1 max-w-12">
                  <div 
                    className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg w-full transition-all hover:from-blue-500 hover:to-blue-300"
                    style={{ 
                      height: `${Math.max(8, (item.value / Math.max(...analytics.revenueData.map(d => d.value), 1)) * 200)}px` 
                    }}
                  />
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    {new Date(item.date).getMonth() + 1}/{new Date(item.date).getDate()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-800/30 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Revenue data will appear here</p>
                <p className="text-sm text-gray-500">Start making sales to see trends</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">Top Products</h3>
          <div className="space-y-4">
            {analytics?.topProducts && analytics.topProducts.length > 0 ? (
              analytics.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-gray-400">{product.sales} views</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">${product.revenue}</p>
                    <p className="text-xs text-gray-400">Price</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No product data yet</p>
                <p className="text-sm text-gray-500">Product views will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Traffic Sources and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">Traffic Sources</h3>
          <div className="space-y-4">
            {analytics?.trafficSources && analytics.trafficSources.length > 0 ? (
              analytics.trafficSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300">{source.source}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-700 rounded-full h-2 w-24">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                    <span className="text-white font-medium w-12 text-right">{source.users}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-400">No traffic data yet</p>
                <p className="text-sm text-gray-500">Traffic sources will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-400">No recent activity</p>
                <p className="text-sm text-gray-500">User activity will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}