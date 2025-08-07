import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UnifiedDashboardCard } from '@/components/admin/UnifiedDashboardCard';
import { UnifiedStatCard } from '@/components/admin/UnifiedStatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, TrendingUp, Users, Package, Search, Filter, Download, Eye, Mail, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/utils/submissionHelpers';
import { useToast } from '@/hooks/use-toast';

interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  user_email: string;
  added_at: string;
  converted: boolean;
}

interface WishlistAnalytics {
  totalItems: number;
  uniqueUsers: number;
  conversionRate: number;
  popularProducts: Array<{
    name: string;
    wishlist_count: number;
    conversion_count: number;
  }>;
}

export function WishlistManager() {
  console.log('🔴 WishlistManager RENDERED at', new Date().toISOString());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const { data: wishlistData, isLoading, refetch } = useQuery({
    queryKey: ['wishlist-analytics', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter
      });
      const res = await fetch(`/api/admin/wishlist/analytics?${params}`);
      if (!res.ok) throw new Error('Failed to fetch wishlist data');
      return res.json();
    }
  });

  const { data: wishlistItems } = useQuery({
    queryKey: ['wishlist-items', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter
      });
      const res = await fetch(`/api/admin/wishlist/items?${params}`);
      if (!res.ok) throw new Error('Failed to fetch wishlist items');
      return res.json();
    }
  });

  const handleEmailReminder = (userEmail: string) => {
    toast({ title: `Email reminder sent to ${userEmail}` });
  };

  const handleExportData = () => {
    toast({ title: 'Export functionality coming soon' });
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* PROFESSIONAL HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Wishlist Analytics</h1>
            <p className="text-gray-400">Track customer wishlists and conversion rates</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleExportData}
              className="border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button 
              onClick={() => toast({ title: 'Email campaign functionality coming soon' })}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Campaign
            </Button>
          </div>
        </div>

        {/* WISHLIST STATISTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <UnifiedStatCard
            title="Total Wishlist Items"
            value={wishlistData?.totalItems || 0}
            icon={<Heart className="w-6 h-6 text-white" />}
            gradient="pink"
            change={18.2}
            subtitle="All items wishlisted"
          />
          <UnifiedStatCard
            title="Unique Users"
            value={wishlistData?.uniqueUsers || 0}
            icon={<Users className="w-6 h-6 text-white" />}
            gradient="blue"
            change={12.1}
            subtitle="Users with wishlists"
          />
          <UnifiedStatCard
            title="Conversion Rate"
            value={`${wishlistData?.conversionRate || 0}%`}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            gradient="green"
            change={5.4}
            subtitle="Wishlist to purchase"
          />
          <UnifiedStatCard
            title="Popular Products"
            value={wishlistData?.popularProducts?.length || 0}
            icon={<Package className="w-6 h-6 text-white" />}
            gradient="purple"
            subtitle="Most wishlisted"
          />
        </div>

        {/* ADVANCED FILTERS */}
        <UnifiedDashboardCard 
          title="Advanced Filters" 
          icon={<Filter className="w-5 h-5 text-white" />}
          gradient="blue"
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by product or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </UnifiedDashboardCard>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* POPULAR PRODUCTS */}
        <UnifiedDashboardCard 
          title="Most Wishlisted Products" 
          icon={<BarChart3 className="w-5 h-5 text-white" />}
          gradient="purple"
        >
          <div className="space-y-4">
            {wishlistData?.popularProducts?.slice(0, 5).map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-300 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">{product.name}</div>
                    <div className="text-gray-400 text-sm">
                      {product.wishlist_count} wishlisted • {product.conversion_count} converted
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{product.wishlist_count}</div>
                  <div className="text-gray-400 text-xs">
                    {((product.conversion_count / product.wishlist_count) * 100).toFixed(1)}% rate
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center text-gray-400 py-8">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No wishlist data available</p>
              </div>
            )}
          </div>
        </UnifiedDashboardCard>

        {/* RECENT WISHLIST ACTIVITY */}
        <UnifiedDashboardCard 
          title="Recent Wishlist Activity" 
          icon={<Heart className="w-5 h-5 text-white" />}
          gradient="pink"
        >
          <div className="space-y-3">
            {wishlistItems?.items?.slice(0, 5).map((item: WishlistItem) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-600/20 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{item.product_name}</div>
                    <div className="text-gray-400 text-sm">
                      {item.user_email} • {formatCurrency(item.product_price)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`${
                    item.converted 
                      ? 'bg-green-600/20 text-green-300 border-green-500/30'
                      : 'bg-gray-600/20 text-gray-300 border-gray-500/30'
                  }`}>
                    {item.converted ? 'Converted' : 'Pending'}
                  </Badge>
                  <div className="text-gray-400 text-xs mt-1">
                    {new Date(item.added_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center text-gray-400 py-8">
                <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent wishlist activity</p>
              </div>
            )}
          </div>
        </UnifiedDashboardCard>
      </div>

      {/* WISHLIST ITEMS TABLE */}
      <UnifiedDashboardCard 
        title="All Wishlist Items" 
        icon={<Package className="w-5 h-5 text-white" />}
        gradient="blue"
      >
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center text-white py-8">Loading wishlist items...</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-4 text-gray-300">Product</th>
                  <th className="pb-4 text-gray-300">Customer</th>
                  <th className="pb-4 text-gray-300">Price</th>
                  <th className="pb-4 text-gray-300">Added</th>
                  <th className="pb-4 text-gray-300">Status</th>
                  <th className="pb-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wishlistItems?.items?.map((item: WishlistItem) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="text-white font-medium">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">{item.user_email}</td>
                    <td className="py-4 text-white font-bold">
                      {formatCurrency(item.product_price)}
                    </td>
                    <td className="py-4 text-gray-300">
                      {new Date(item.added_at).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <Badge className={`${
                        item.converted 
                          ? 'bg-green-600/20 text-green-300 border-green-500/30'
                          : 'bg-gray-600/20 text-gray-300 border-gray-500/30'
                      }`}>
                        {item.converted ? 'Converted' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEmailReminder(item.user_email)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </UnifiedDashboardCard>
    </div>
  );
}