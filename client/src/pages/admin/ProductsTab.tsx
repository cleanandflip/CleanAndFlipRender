// UNIFIED PRODUCTS TAB
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Plus, DollarSign, Eye, Edit2, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { useToast } from '@/hooks/use-toast';
import { EnhancedProductModal } from '@/components/admin/modals/EnhancedProductModal';

interface Product {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  price: number;
  stock: number;
  brand?: string;
  condition?: string;
  status: 'active' | 'inactive';
  images?: string[];
}

export function ProductsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  
  const { data: productsData, isLoading, refetch, error } = useQuery({
    queryKey: ['admin-products', searchQuery],
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
      const res = await fetch(`/api/admin/products?${params}`, { credentials: 'include' });
      if (!res.ok) {
        console.error('Products API failed:', res.status, res.statusText);
        throw new Error(`Failed to fetch products: ${res.status}`);
      }
      const data = await res.json();
      console.log('Products API response:', data);
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }
  });

  const products = Array.isArray(productsData?.data) ? productsData.data : 
                   Array.isArray(productsData?.products) ? productsData.products : 
                   Array.isArray(productsData) ? productsData : [];

  // Action handlers
  const handleView = (product: Product) => {
    console.log('View:', product);
    window.open(`/product/${product.id}`, '_blank');
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleDelete = async (product: Product) => {
    console.log('Delete:', product);
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        refetch(); // Refresh the data
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    console.log('Export');
    try {
      const res = await fetch('/api/admin/products/export', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({
          title: "Success",
          description: "Products exported successfully",
        });
      }
    } catch (error) {
      console.error('Error exporting products:', error);
      toast({
        title: "Error",
        description: "Failed to export products",
        variant: "destructive",
      });
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          <img 
            src={product.images?.[0] || '/placeholder.jpg'} 
            alt={product.name}
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <p className="font-medium text-white">{product.name}</p>
            <p className="text-sm text-gray-500">ID: {product.id}</p>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true
    },
    {
      key: 'price',
      label: 'Price',
      render: (product: Product) => (
        <span className="font-medium">${product.price.toFixed(2)}</span>
      ),
      sortable: true
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (product: Product) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          product.stock > 5 ? "bg-green-500/20 text-green-400" : 
          product.stock > 0 ? "bg-yellow-500/20 text-yellow-400" : 
          "bg-red-500/20 text-red-400"
        )}>
          {product.stock} units
        </span>
      ),
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (product: Product) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          product.status === 'active' 
            ? "bg-green-500/20 text-green-400" 
            : "bg-gray-500/20 text-gray-400"
        )}>
          {product.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UnifiedMetricCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          change={{ value: 12, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Active Products"
          value={products.filter((p: Product) => p.status === 'active').length}
          icon={Package}
          change={{ value: 8, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Total Value"
          value={`$${products.reduce((sum: number, p: Product) => sum + (p.price * p.stock), 0).toLocaleString()}`}
          icon={DollarSign}
          change={{ value: 23, label: 'from last month' }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Product Management</h2>
          <p className="text-gray-400 mt-1">Manage your Clean & Flip inventory</p>
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
      <UnifiedDataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search products by name, SKU, or category..."
        onSearch={setSearchQuery}
        onRefresh={refetch}
        onExport={handleExport}
        loading={isLoading}
        actions={{
          onView: handleView,
          onEdit: handleEdit,
          onDelete: handleDelete
        }}
        pagination={{
          currentPage: 1,
          totalPages: Math.ceil(products.length / 20) || 1,
          onPageChange: (page) => console.log('Page:', page)
        }}
      />

      {/* Modal */}
      {showProductModal && (
        <EnhancedProductModal 
          product={selectedProduct}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }} 
          onSave={refetch}
        />
      )}
    </div>
  );
}