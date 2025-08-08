// UNIFIED WISHLIST TAB
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, TrendingUp, Users, Package, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { useToast } from '@/hooks/use-toast';

interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  userEmail: string;
  addedAt: string;
  category: string;
  price: number;
}

export function WishlistTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const { data: wishlistData, isLoading, refetch } = useQuery({
    queryKey: ['admin-wishlist', searchQuery],
    queryFn: async () => {
      // Mock data for now - replace with actual API
      return {
        items: [
          {
            id: '1',
            productId: 'prod_1',
            productName: 'Olympic Barbell Set',
            productImage: '/placeholder.jpg',
            userEmail: 'john@example.com',
            addedAt: new Date().toISOString(),
            category: 'Barbells',
            price: 299.99
          },
          // Add more mock items as needed
        ]
      };
    }
  });

  const wishlistItems: WishlistItem[] = wishlistData?.items || [];

  // Action handlers
  const handleView = (item: WishlistItem) => {
    console.log('View:', item);
    window.open(`/product/${item.productId}`, '_blank');
    toast({
      title: "Opening Product",
      description: `Opening ${item.productName} in new tab`,
    });
  };

  const handleEdit = (item: WishlistItem) => {
    console.log('Edit:', item);
    toast({
      title: "Wishlist Item",
      description: `Managing wishlist item for ${item.productName}`,
    });
  };

  const handleDelete = async (item: WishlistItem) => {
    if (!confirm(`Remove ${item.productName} from ${item.userEmail}'s wishlist?`)) return;
    
    try {
      const res = await fetch(`/api/admin/wishlist/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        refetch();
        toast({
          title: "Removed from Wishlist",
          description: `${item.productName} has been removed from wishlist`,
        });
      } else {
        throw new Error('Failed to remove item');
      }
    } catch (error) {
      toast({
        title: "Remove Failed",
        description: "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportWishlist = async () => {
    try {
      const csvHeaders = 'Product,User Email,Category,Price,Added Date\n';
      const csvData = wishlistItems.map((w: WishlistItem) => 
        `"${w.productName}","${w.userEmail}","${w.category}","$${w.price.toFixed(2)}","${new Date(w.addedAt).toLocaleDateString()}"`
      ).join('\n');
      
      const fullCsv = csvHeaders + csvData;
      const blob = new Blob([fullCsv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wishlist-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Exported ${wishlistItems.length} wishlist items to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export wishlist data",
        variant: "destructive",
      });
    }
  };

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (item: WishlistItem) => (
        <div className="flex items-center gap-3">
          <img 
            src={item.productImage || '/placeholder.jpg'} 
            alt={item.productName}
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <p className="font-medium text-white">{item.productName}</p>
            <p className="text-sm text-gray-500">{item.category}</p>
          </div>
        </div>
      )
    },
    {
      key: 'userEmail',
      label: 'User',
      render: (item: WishlistItem) => (
        <span className="text-gray-300">{item.userEmail}</span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (item: WishlistItem) => (
        <span className="font-medium text-green-400">${item.price.toFixed(2)}</span>
      ),
      sortable: true
    },
    {
      key: 'addedAt',
      label: 'Added',
      render: (item: WishlistItem) => (
        <span className="text-gray-400">
          {new Date(item.addedAt).toLocaleDateString()}
        </span>
      ),
      sortable: true
    }
  ];

  // Mock analytics data
  const topWishlisted = [
    { name: 'Olympic Barbell Set', count: 23 },
    { name: 'Adjustable Dumbbells', count: 18 },
    { name: 'Power Rack', count: 15 },
    { name: 'Weight Plates', count: 12 },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <UnifiedMetricCard
          title="Total Wishlist Items"
          value={wishlistItems.length}
          icon={Heart}
          change={{ value: 18, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Unique Users"
          value={new Set(wishlistItems.map(i => i.userEmail)).size}
          icon={Users}
          change={{ value: 12, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Unique Products"
          value={new Set(wishlistItems.map(i => i.productId)).size}
          icon={Package}
          change={{ value: 8, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Avg Items/User"
          value={(wishlistItems.length / new Set(wishlistItems.map(i => i.userEmail)).size || 0).toFixed(1)}
          icon={TrendingUp}
          change={{ value: 5, label: 'from last month' }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Wishlist Analytics</h2>
          <p className="text-gray-400 mt-1">Track what users want most</p>
        </div>
        <div className="flex gap-3">
          <UnifiedButton
            variant="secondary"
            icon={RefreshCw}
            onClick={() => {
              refetch();
              toast({
                title: "Data Refreshed",
                description: "Wishlist data has been updated",
              });
            }}
          >
            Refresh
          </UnifiedButton>
          <UnifiedButton
            variant="secondary"
            onClick={() => {
              // Export wishlist data
              const csvHeaders = 'Product,User,Price,Added Date\n';
              const csvData = wishlistItems.map((item: WishlistItem) => 
                `"${item.productName}","${item.userEmail}","$${item.price}","${new Date(item.addedAt).toLocaleDateString()}"`
              ).join('\n');
              
              const fullCsv = csvHeaders + csvData;
              const blob = new Blob([fullCsv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `wishlist-export-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
              
              toast({
                title: "Export Complete",
                description: `Exported ${wishlistItems.length} wishlist items to CSV`,
              });
            }}
          >
            Export Data
          </UnifiedButton>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wishlist Table */}
        <div className="lg:col-span-2">
          <UnifiedDataTable
            data={wishlistItems}
            columns={columns}
            searchPlaceholder="Search wishlist items..."
            onSearch={setSearchQuery}
            onRefresh={refetch}
            onExport={handleExportWishlist}
            loading={isLoading}
            actions={{
              onView: handleView,
              onEdit: handleEdit,
              onDelete: handleDelete
            }}
            pagination={{
              currentPage: 1,
              totalPages: Math.ceil(wishlistItems.length / 20) || 1,
              onPageChange: (page) => console.log('Page:', page)
            }}
          />
        </div>
      </div>

      {/* Top Wishlisted Products */}
      <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Most Wishlisted Products</h3>
        <div className="space-y-4">
          {topWishlisted.map((product, index) => (
            <div key={product.name} className="flex items-center justify-between p-3 bg-[#0f172a]/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-white text-sm font-bold">
                  #{index + 1}
                </div>
                <span className="text-white">{product.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-medium">{product.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}