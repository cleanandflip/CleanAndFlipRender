import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UnifiedDashboardCard } from '@/components/admin/UnifiedDashboardCard';
import { UnifiedStatCard } from '@/components/admin/UnifiedStatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductModal } from '@/components/admin/ProductModal';
import { Plus, Edit, Eye, Trash2, Package, DollarSign, TrendingUp, AlertTriangle, Search, Filter, Download, Grid, List } from 'lucide-react';
import { formatCurrency } from '@/utils/submissionHelpers';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out-of-stock';
  category: string;
  images: string[];
  created_at: string;
}

const defaultFilters = {
  search: '',
  category: 'all',
  status: 'all',
  sortBy: 'created',
  sortOrder: 'desc' as 'asc' | 'desc',
  priceRange: { min: 0, max: 10000 },
  page: 1,
  limit: 20
};

export function ProductsManager() {
  console.log('🔴 ProductsManager RENDERED at', new Date().toISOString());
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['admin-products', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: filters.search,
        category: filters.category,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        priceMin: filters.priceRange.min.toString(),
        priceMax: filters.priceRange.max.toString(),
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });
      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  const handleBulkDelete = () => {
    toast({ title: "Bulk delete functionality coming soon" });
  };

  const handleExport = (format: 'csv' | 'pdf' = 'csv') => {
    toast({ title: "Export functionality coming soon" });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Delete "${product.name}"?`)) {
      try {
        const res = await fetch(`/api/admin/products/${product.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to delete product');
        refetch();
        toast({ title: "Product deleted successfully" });
      } catch (error) {
        toast({ title: "Error deleting product", variant: "destructive" });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: 'default', className: 'bg-green-600/20 text-green-300 border-green-500/30' },
      inactive: { variant: 'secondary', className: 'bg-gray-600/20 text-gray-300 border-gray-500/30' },
      'out-of-stock': { variant: 'destructive', className: 'bg-red-600/20 text-red-300 border-red-500/30' }
    };
    return variants[status] || variants.inactive;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* NUCLEAR OPTION: MASSIVE VISIBLE UPDATE BANNER */}
      <div style={{ 
        backgroundColor: '#00FF00', 
        color: '#000000', 
        padding: '30px', 
        fontSize: '32px', 
        fontWeight: 'bold', 
        textAlign: 'center', 
        margin: '20px 0',
        border: '10px solid #FF0000',
        borderRadius: '15px',
        boxShadow: '0 0 30px rgba(0, 255, 0, 0.8)'
      }}>
        ✅ PRODUCTS MANAGER COMPLETELY UPDATED: {Date.now()}
      </div>
      {/* PROFESSIONAL HEADER SECTION */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Products Manager</h1>
            <p className="text-gray-400">Manage your product inventory and performance</p>
          </div>
          <div className="flex items-center gap-4">
            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
                <span className="text-blue-300 text-sm font-medium">{selectedProducts.size} selected</span>
                <Button size="sm" variant="destructive" onClick={() => handleBulkDelete()}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* PRODUCT STATISTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <UnifiedStatCard
            title="Total Products"
            value={products?.pagination?.total || products?.products?.length || 0}
            icon={<Package className="w-6 h-6 text-white" />}
            gradient="blue"
            change={5.2}
            subtitle="All products"
          />
          <UnifiedStatCard
            title="Active Products"
            value={products?.products?.filter((p: Product) => p.status === 'active').length || 0}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            gradient="green"
            change={2.1}
            subtitle="Currently active"
          />
          <UnifiedStatCard
            title="Total Value"
            value={`$${products?.products?.reduce((sum: number, p: Product) => sum + (p.price * p.stock), 0).toFixed(2) || '0.00'}`}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            gradient="purple"
            change={-1.2}
            subtitle="Inventory value"
          />
          <UnifiedStatCard
            title="Low Stock"
            value={products?.products?.filter((p: Product) => p.stock < 5).length || 0}
            icon={<AlertTriangle className="w-6 h-6 text-white" />}
            gradient="orange"
            subtitle="Need attention"
          />
        </div>

        {/* ADVANCED FILTERS */}
        <UnifiedDashboardCard 
          title="Advanced Filters" 
          icon={<Filter className="w-5 h-5 text-white" />}
          gradient="blue"
          className="mb-6"
          actions={
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value, page: 1 }))}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-700" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </UnifiedDashboardCard>
      </div>

      {/* PRODUCTS TABLE/GRID */}
      <UnifiedDashboardCard gradient="blue">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center text-white py-8">Loading products...</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-4 text-gray-300">
                    <Checkbox />
                  </th>
                  <th className="pb-4 text-gray-300">Product</th>
                  <th className="pb-4 text-gray-300">Category</th>
                  <th className="pb-4 text-gray-300">Price</th>
                  <th className="pb-4 text-gray-300">Stock</th>
                  <th className="pb-4 text-gray-300">Status</th>
                  <th className="pb-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products?.products?.map((product: Product) => (
                  <tr key={product.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-4">
                      <Checkbox />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{product.name}</div>
                          <div className="text-gray-400 text-sm truncate max-w-xs">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">{product.category}</td>
                    <td className="py-4 text-white font-bold">{formatCurrency(product.price)}</td>
                    <td className="py-4">
                      <span className={`font-medium ${product.stock < 5 ? 'text-red-400' : 'text-white'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-4">
                      <Badge className={getStatusBadge(product.status).className}>
                        {product.status}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => window.open(`/products/${product.id}`, '_blank')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product)}>
                          <Trash2 className="w-4 h-4" />
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

      {/* MODALS */}
      {isEditModalOpen && editingProduct && (
        <ProductModal
          product={editingProduct}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            refetch();
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {isCreateModalOpen && (
        <ProductModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={() => {
            refetch();
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
}