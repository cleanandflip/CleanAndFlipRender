import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { MetricCard } from '@/components/admin/MetricCard';
import { DataTable } from '@/components/admin/DataTable';
import { Pagination } from '@/components/admin/Pagination';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Heart, Users, TrendingUp, Clock, Download, Search, Filter, 
  ExternalLink, Eye, ShoppingCart, AlertTriangle, Lightbulb,
  BarChart3, Calendar, Mail, Star, Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WishlistFilters {
  timeRange: '7d' | '30d' | '90d' | '365d';
  search: string;
  userType: 'all' | 'power' | 'active' | 'casual';
  page: number;
  limit: number;
}

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

export function WishlistManager() {
  const [filters, setFilters] = useState<WishlistFilters>({
    timeRange: '30d',
    search: '',
    userType: 'all',
    page: 1,
    limit: 20
  });

  // Action handlers for wishlist items
  const handleViewProduct = (productId: string) => {
    window.open(`/products/${productId}`, '_blank');
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
        credentials: 'include'
      });
      if (res.ok) {
        toast({ title: "Added to cart" });
      }
    } catch (error) {
      toast({ title: "Error adding to cart", variant: "destructive" });
    }
  };

  // Action handlers for users
  const handleViewUserWishlist = (userId: string) => {
    toast({
      title: "User Wishlist",
      description: "User wishlist details accessed",
    });
  };

  const handleEmailUser = (user: any) => {
    window.location.href = `mailto:${user.email}?subject=About your wishlist`;
  };

  const { toast } = useToast();

  const { data: analytics, isLoading } = useQuery<DetailedWishlistAnalytics>({
    queryKey: ['/api/admin/wishlist-analytics/detailed', filters.timeRange],
    refetchInterval: 30000
  });

  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
    try {
      const response = await fetch(`/api/admin/wishlist-analytics/export?format=${format}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wishlist-analytics.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        // Safe removal with timeout to prevent race conditions
        setTimeout(() => {
          if (a.parentNode === document.body) {
            document.body.removeChild(a);
          }
        }, 100);
      }
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${(num || 0).toFixed(2)}`;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <ExternalLink className="w-4 h-4 text-blue-400" />;
    }
  };

  const productColumns = [
    { key: 'productName', label: 'Product Name', sortable: true },
    { key: 'wishlistCount', label: 'Wishlist Count', sortable: true },
    { key: 'productPrice', label: 'Price', sortable: true },
    { key: 'conversionRate', label: 'Conversion Rate', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const userColumns = [
    { key: 'userName', label: 'User Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'itemCount', label: 'Items in Wishlist', sortable: true },
    { key: 'purchaseCount', label: 'Purchases', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const renderProductRow = (product: any, index: number) => (
    <>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-elevated rounded flex-shrink-0">
          {product.productImage && (
            <img 
              src={product.productImage} 
              alt={product.productName}
              className="w-full h-full object-cover rounded"
            />
          )}
        </div>
        <div>
          <p className="font-medium text-text-primary">{product.productName}</p>
          <p className="text-sm text-text-muted">ID: {product.productId.slice(0, 8)}...</p>
        </div>
      </div>
      <div className="text-center">
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
          {product.wishlistCount}
        </Badge>
      </div>
      <div className="text-text-primary font-semibold">
        {formatCurrency(product.productPrice)}
      </div>
      <div className="text-center">
        <Badge variant={product.conversionRate > 20 ? 'default' : 'outline'}>
          {product.conversionRate.toFixed(1)}%
        </Badge>
      </div>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="themed-input"
          onClick={() => handleViewProduct(product.productId)}
          title="View Product"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="themed-input"
          onClick={() => handleAddToCart(product.productId)}
          title="Add to Cart"
        >
          <ShoppingCart className="w-4 h-4" />
        </Button>
      </div>
    </>
  );

  const renderUserRow = (user: any, index: number) => (
    <>
      <div>
        <p className="font-medium text-text-primary">{user.userName}</p>
        <p className="text-sm text-text-muted">ID: {user.userId.slice(0, 8)}...</p>
      </div>
      <div className="text-text-muted">{user.email}</div>
      <div className="text-center">
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
          {user.itemCount}
        </Badge>
      </div>
      <div className="text-center">
        <Badge variant={user.purchaseCount > 0 ? 'default' : 'outline'}>
          {user.purchaseCount}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="themed-input"
          onClick={() => handleViewUserWishlist(user.userId)}
          title="View User Wishlist"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="themed-input"
          onClick={() => handleEmailUser(user)}
          title="Email User"
        >
          <Mail className="w-4 h-4" />
        </Button>
      </div>
    </>
  );

  return (
    <DashboardLayout
      title="Wishlist Analytics"
      description="Monitor user wishlist behavior and conversion patterns"
      totalCount={analytics?.stats?.totalItems || 0}
      searchPlaceholder="Search wishlist data..."
      onSearch={(search) => setFilters({ ...filters, search })}
      onRefresh={() => window.location.reload()}
      onExport={handleExport}
      filters={
        <div className="flex gap-2">
          <Select value={filters.timeRange} onValueChange={(value: any) => setFilters({ ...filters, timeRange: value })}>
            <SelectTrigger className="glass border-border w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.userType} onValueChange={(value: any) => setFilters({ ...filters, userType: value })}>
            <SelectTrigger className="glass border-border w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="power">Power Users</SelectItem>
              <SelectItem value="active">Active Users</SelectItem>
              <SelectItem value="casual">Casual Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      isLoading={isLoading}
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Wishlisted"
          value={analytics?.stats?.totalItems || 0}
          change={analytics?.stats?.itemsChange}
          icon={Heart}
        />
        <MetricCard
          title="Active Users"
          value={analytics?.stats?.activeUsers || 0}
          change={analytics?.stats?.usersChange}
          icon={Users}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${analytics?.stats?.conversionRate || 0}%`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Avg Time in Wishlist"
          value={`${analytics?.stats?.avgDaysInWishlist || 0}d`}
          icon={Clock}
        />
      </div>

      {/* User Segments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass p-6 text-center">
          <Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-white mb-1">
            {analytics?.stats?.powerUsers || 0}
          </div>
          <div className="text-sm text-text-muted">Power Users (10+ items)</div>
        </Card>
        <Card className="glass p-6 text-center">
          <Heart className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-white mb-1">
            {analytics?.stats?.activeWishlisters || 0}
          </div>
          <div className="text-sm text-text-muted">Active Users (5-9 items)</div>
        </Card>
        <Card className="glass p-6 text-center">
          <Users className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-white mb-1">
            {analytics?.stats?.casualUsers || 0}
          </div>
          <div className="text-sm text-text-muted">Casual Users (1-4 items)</div>
        </Card>
      </div>

      {/* Insights */}
      {analytics?.insights && analytics.insights.length > 0 && (
        <Card className="glass p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Actionable Insights
          </h3>
          <div className="space-y-3">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-white">{insight.title}</h4>
                  <p className="text-sm text-text-muted">{insight.description}</p>
                </div>
                <Button size="sm" variant="outline" className="glass border-border">
                  {insight.action}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trend Chart */}
      <Card className="glass p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-white">Wishlist Activity Trend</h3>
        {analytics?.trendData ? (
          <div className="h-64 flex items-end justify-between gap-1">
            {analytics.trendData.slice(-30).map((item: any, index: number) => {
              const maxValue = Math.max(...analytics.trendData.map((d: any) => d.additions + d.removals + d.purchases));
              return (
                <div key={index} className="flex flex-col items-center gap-1 flex-1">
                  <div className="flex flex-col-reverse gap-0.5" style={{ height: '200px' }}>
                    <div 
                      className="bg-blue-500 rounded-sm min-h-[2px]"
                      style={{ height: `${(item.additions / maxValue) * 180}px` }}
                      title={`Additions: ${item.additions}`}
                    />
                    <div 
                      className="bg-red-500 rounded-sm min-h-[2px]"
                      style={{ height: `${(item.removals / maxValue) * 180}px` }}
                      title={`Removals: ${item.removals}`}
                    />
                    <div 
                      className="bg-green-500 rounded-sm min-h-[2px]"
                      style={{ height: `${(item.purchases / maxValue) * 180}px` }}
                      title={`Purchases: ${item.purchases}`}
                    />
                  </div>
                  <div className="text-xs text-text-muted">
                    {new Date(item.date).getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-text-muted">
            No trend data available
          </div>
        )}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-text-muted">Additions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-text-muted">Removals</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-text-muted">Purchases</span>
          </div>
        </div>
      </Card>

      {/* Data Tables */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Top Products
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card className="glass p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Most Wishlisted Products</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
                  <Input
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="glass border-border pl-10 w-64"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {analytics?.topProducts?.map((product, index) => (
                <Card key={product.productId} className="glass p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {renderProductRow(product, index)}
                  </div>
                </Card>
              ))}
              {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
                <div className="text-center py-8 text-text-muted">
                  No product data available
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="glass p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Top Wishlist Users</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
                  <Input
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="glass border-border pl-10 w-64"
                  />
                </div>
                <Select value={filters.userType} onValueChange={(value: any) => setFilters({ ...filters, userType: value })}>
                  <SelectTrigger className="glass border-border w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="power">Power Users</SelectItem>
                    <SelectItem value="active">Active Users</SelectItem>
                    <SelectItem value="casual">Casual Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-3">
              {analytics?.topUsers?.map((user, index) => (
                <Card key={user.userId} className="glass p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {renderUserRow(user, index)}
                  </div>
                </Card>
              ))}
              {(!analytics?.topUsers || analytics.topUsers.length === 0) && (
                <div className="text-center py-8 text-text-muted">
                  No user data available
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}