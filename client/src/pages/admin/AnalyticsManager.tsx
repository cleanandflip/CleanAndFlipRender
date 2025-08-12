import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui';
// Using simplified date picker approach instead of complex calendar
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Calendar } from '@/components/ui/calendar';
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
          <Dropdown
            options={quickDateRanges.map(range => ({
              value: range.days.toString(),
              label: range.label
            }))}
            value=""
            onChange={(value: string | string[]) => {
              const days = parseInt(value as string);
              setDateRange({
                from: subDays(new Date(), days),
                to: new Date()
              });
            }}
            placeholder="Select date range"
            className="glass border-border"
          />
          
          <Dropdown
            options={[
              { value: 'revenue', label: 'Revenue' },
              { value: 'orders', label: 'Orders' },
              { value: 'users', label: 'New Users' },
              { value: 'conversion', label: 'Conversion Rate' },
              { value: 'submissions', label: 'Submissions' }
            ]}
            value={metric}
            onChange={(value: string | string[]) => setMetric(value as string)}
            className="glass border-border"
          />
          
          <Dropdown
            options={[
              { value: 'hour', label: 'Hourly' },
              { value: 'day', label: 'Daily' },
              { value: 'week', label: 'Weekly' },
              { value: 'month', label: 'Monthly' }
            ]}
            value={groupBy}
            onChange={(value: string | string[]) => setGroupBy(value as string)}
            className="glass border-border"
          />
          
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
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard
          title="Total Revenue"
          value={`$${(analytics?.totalRevenue || 0).toFixed(2)}`}
          change={analytics?.revenueChange}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Orders"
          value={analytics?.totalOrders || 0}
          change={analytics?.ordersChange}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${(analytics?.conversionRate || 0).toFixed(1)}%`}
          change={analytics?.conversionChange}
          icon={TrendingUp}
        />
        <MetricCard
          title="Avg Order Value"
          value={`$${(analytics?.avgOrderValue || 0).toFixed(2)}`}
          change={analytics?.aovChange}
          icon={Calculator}
        />
        <MetricCard
          title="Total Users"
          value={analytics?.totalUsers || 0}
          change={analytics?.usersChange}
          icon={Users}
        />
        <MetricCard
          title="Total Products"
          value={analytics?.totalProducts || 0}
          change={analytics?.productsChange}
          icon={Package}
        />
      </div>
      
      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center text-text-muted">
            Revenue chart coming soon
          </div>
        </Card>
        
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Top Products</h3>
          <div className="space-y-3">
            {analytics?.topProducts && analytics.topProducts.length > 0 ? 
              analytics.topProducts.slice(0, 5).map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-white truncate">{product.name}</p>
                    <p className="text-sm text-text-muted">{product.sales} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">${(product.revenue || 0).toFixed(2)}</p>
                  </div>
                </div>
              )) : (
                <p className="text-text-muted text-center py-8">No product data available</p>
              )
            }
          </div>
        </Card>
        
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Recent Activity</h3>
          <div className="space-y-3">
            {analytics?.recentActivity && analytics.recentActivity.length > 0 ? 
              analytics.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <div className="flex-1">
                    <p className="font-medium text-white">{activity.description}</p>
                    <p className="text-sm text-text-muted">{activity.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">{new Date(activity.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : (
                <p className="text-text-muted text-center py-8">No recent activity</p>
              )
            }
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}