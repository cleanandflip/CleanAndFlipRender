// PRODUCTS TAB WITH COMPLETE LIVE SYNC
import { useState, useEffect } from 'react';
import { Package, Plus, RefreshCw, Wifi, WifiOff, TrendingUp } from 'lucide-react';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { EnhancedProductModal } from '@/components/admin/modals/EnhancedProductModal';
import { useWebSocketState } from '@/hooks/useWebSocketState';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  brand: string;
  condition: string;
  description: string;
  images: string[];
  category: string;
  categoryId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function ProductsTab() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { ready, subscribe } = useWebSocketState();
  const queryClient = useQueryClient();

  // Fetch products with React Query
  const {
    data: productsData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/admin/products'],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchQuery,
        category: 'all',
        status: 'all',
        sortBy: 'name',
        sortOrder: 'asc',
        page: '1',
        limit: '20'
      });
      
      try {
        const res = await fetch(`/api/admin/products?${params}`, {
          credentials: 'include'
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        console.error('Failed to fetch products:', error);
        throw error;
      }
    }
  });

  const products = productsData?.data || [];

  // Setup live sync with new typed WebSocket system
  useEffect(() => {
    return subscribe("product:update", (msg) => {
      console.log('🔄 Live sync: Refreshing products', msg);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      
      // Trigger animation for data table
      const tableElement = document.querySelector('[data-table="products"]');
      if (tableElement) {
        tableElement.classList.add('animate-fadeIn');
        setTimeout(() => tableElement.classList.remove('animate-fadeIn'), 500);
      }
    });
  }, [subscribe, queryClient]);

  // Handle product actions
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        toast({
          title: "Product Deleted",
          description: `${product.name} has been removed`,
        });

        refetch();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    window.open('/api/admin/products/export?format=csv', '_blank');
  };

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: 'Product Name',
      render: (product: Product) => (
        <div className="font-medium text-white">{product.name}</div>
      ),
      sortable: true
    },
    {
      key: 'category',
      label: 'Category',
      render: (product: Product) => (
        <span className="text-gray-400">{product.category}</span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (product: Product) => (
        <span className="font-mono text-green-400">${product.price}</span>
      ),
      sortable: true
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (product: Product) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
          product.stock > 0 
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {product.stock} units
        </span>
      ),
      sortable: true
    },
    {
      key: 'condition',
      label: 'Condition',
      render: (product: Product) => (
        <span className="text-gray-400 capitalize">{product.condition}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (product: Product) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
          product.status === 'active'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-gray-500/20 text-gray-400'
        }`}>
          {product.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <UnifiedMetricCard
          title="Total Products"
          value={products.length}
          icon={Package}
          change={{ value: 15, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Active Products"
          value={products.filter((p: Product) => p.status === 'active').length}
          icon={Package}
          change={{ value: 8, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Low Stock"
          value={products.filter((p: Product) => p.stock < 5).length}
          icon={TrendingUp}
          change={{ value: -3, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Out of Stock"
          value={products.filter((p: Product) => p.stock === 0).length}
          icon={Package}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Product Management</h2>
            <div className="flex items-center gap-2">
              {ready ? (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                  <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">Live Sync</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">Offline</span>
                </div>
              )}
              <span className="text-xs text-gray-500">({ready ? 'Connected' : 'Disconnected'})</span>
            </div>
          </div>
          <p className="text-gray-400 mt-1">Manage your product catalog and inventory</p>
        </div>
        <UnifiedButton
          variant="primary"
          icon={Plus}
          onClick={handleAddProduct}
        >
          Add Product
        </UnifiedButton>
      </div>

      {/* Table */}
      <div data-table="products">
        <UnifiedDataTable
          data={products}
          columns={columns}
          searchPlaceholder="Search products by name, brand, or description..."
          onSearch={setSearchQuery}
          onRefresh={refetch}
          onExport={handleExport}
          loading={isLoading}
          actions={{
            onView: handleEditProduct,
            onEdit: handleEditProduct,
            onDelete: handleDeleteProduct
          }}
          pagination={{
            currentPage: 1,
            totalPages: Math.ceil(products.length / 20) || 1,
            onPageChange: (page) => console.log('Page:', page)
          }}
        />
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <EnhancedProductModal
          product={selectedProduct}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
          onSave={() => {
            refetch();
            
            // Server publishes WebSocket updates automatically
          }}
        />
      )}
    </div>
  );
}
