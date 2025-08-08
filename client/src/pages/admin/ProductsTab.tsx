// UNIFIED PRODUCTS TAB
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Plus, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';

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
          onClick={() => {/* Add product modal */}}
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
        onExport={() => console.log('Export')}
        loading={isLoading}
        actions={{
          onView: (product) => console.log('View:', product),
          onEdit: (product) => console.log('Edit:', product),
          onDelete: (product) => console.log('Delete:', product)
        }}
        pagination={{
          currentPage: 1,
          totalPages: Math.ceil(products.length / 20) || 1,
          onPageChange: (page) => console.log('Page:', page)
        }}
      />
    </div>
  );
}