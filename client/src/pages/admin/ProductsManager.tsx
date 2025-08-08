import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { Pagination } from '@/components/admin/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  
  div,
  div,
  StandardDropdown,
  div
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductModal } from '@/components/admin/ProductModal';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/submissionHelpers';
import { useToast } from '@/hooks/use-toast';
import { broadcastProductUpdate } from '@/lib/queryClient';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  status: 'active' | 'inactive' | 'out-of-stock';
  createdAt: string;
  images?: string[];
}

const defaultFilters = {
  search: '',
  category: 'all',
  status: 'all',
  priceRange: { min: 0, max: 10000 },
  sortBy: 'name',
  sortOrder: 'asc' as 'asc' | 'desc',
  page: 1,
  limit: 20
};

export function ProductsManager() {
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
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await fetch('/api/admin/categories', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      return data.categories || [];
    }
  });

  const handleBulkAction = async (action: string) => {
    const confirmActions: Record<string, string> = {
      delete: 'delete these products',
      deactivate: 'deactivate these products',
      duplicate: 'duplicate these products'
    };
    
    if (confirm(`Are you sure you want to ${confirmActions[action]}?`)) {
      try {
        await fetch('/api/admin/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, productIds: Array.from(selectedProducts) })
        });
        setSelectedProducts(new Set());
        refetch();
      } catch (error) {
        console.error('Bulk action failed:', error);
      }
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        format,
        search: filters.search,
        category: filters.category,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        priceMin: filters.priceRange.min.toString(),
        priceMax: filters.priceRange.max.toString()
      });
      
      const response = await fetch(`/api/admin/products/export?${params}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else {
        const data = await response.json();

      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    return count;
  };

  const handleViewProduct = (product: Product) => {
    window.open(`/products/${product.id}`, '_blank');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, productData }: { productId: string; productData: Partial<Product> }) => {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(productData)
      });
      
      if (!res.ok) {
        throw new Error('Failed to update product');
      }
      return res.json();
    },
    onSuccess: (data, { productId, productData }) => {
      // Invalidate ALL product-related queries with correct query keys
      queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['/api/products'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      
      // Force immediate refetch for the current view
      queryClient.refetchQueries({ queryKey: ['admin-products'] });
      
      // Use the global broadcast system for real-time sync
      broadcastProductUpdate(productId, 'product_update', productData);
      
      setIsEditModalOpen(false);
      setEditingProduct(null);
      toast({ title: "Product updated successfully" });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({ title: "Error updating product", variant: "destructive" });
    }
  });

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (!editingProduct) return;
    updateProductMutation.mutate({ productId: editingProduct.id, productData });
  };

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (_, productId) => {
      // Invalidate ALL product-related queries with correct query keys
      queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['/api/products'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      // Force immediate refetch for the current view
      queryClient.refetchQueries({ queryKey: ['admin-products'] });
      
      // Use global broadcast system for comprehensive real-time sync
      broadcastProductUpdate(productId, 'product_delete', { deleted: true });
      
      toast({ title: "Product deleted successfully" });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({ 
        title: "Error deleting product",
        variant: "destructive"
      });
    }
  });

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'secondary',
      inactive: 'outline',
      'out-of-stock': 'destructive'
    };
    return variants[status] || 'outline';
  };

  return (
    <DashboardLayout
      title="Product Management"
      description="Manage your Clean & Flip inventory"
      totalCount={products?.total || 0}
      searchPlaceholder="Search products by name, SKU, or category..."
      onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
      onRefresh={refetch}
      onExport={handleExport}
      viewMode="both"
      currentView={viewMode}
      onViewChange={setViewMode}
      isLoading={isLoading}
      activeFiltersCount={getActiveFiltersCount()}
      sortOptions={[
        { value: 'name-asc', label: 'Name A-Z' },
        { value: 'name-desc', label: 'Name Z-A' },
        { value: 'price-asc', label: 'Price Low to High' },
        { value: 'price-desc', label: 'Price High to Low' },
        { value: 'stock-asc', label: 'Stock Low to High' },
        { value: 'created-desc', label: 'Newest First' }
      ]}
      onSort={(value) => {
        const [sortBy, sortOrder] = value.split('-');
        setFilters({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
      }}
      filters={
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={filters.category}
            onValueChange={(v) => setFilters({ ...filters, category: v, page: 1 })}
          >
            <UnifiedDropdown className="glass border-border">
              <div placeholder="All Categories" />
            </UnifiedDropdown>
            <div className="glass border-border">
              <div value="all">All Categories</div>
              <div value="barbells">Barbells</div>
              <div value="plates">Plates</div>
              <div value="dumbbells">Dumbbells</div>
              <div value="racks">Racks & Storage</div>
              <div value="cardio">Cardio Equipment</div>
            </div>
          </Select>
          
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters({ ...filters, status: v, page: 1 })}
          >
            <UnifiedDropdown className="glass border-border">
              <div placeholder="All Statuses" />
            </UnifiedDropdown>
            <div className="glass border-border">
              <div value="all">All Statuses</div>
              <div value="active">Active</div>
              <div value="inactive">Inactive</div>
              <div value="out-of-stock">Out of Stock</div>
            </div>
          </Select>
          
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min price"
              value={filters.priceRange.min || ''}
              onChange={(e) => setFilters({
                ...filters,
                priceRange: { ...filters.priceRange, min: Number(e.target.value) || 0 }
              })}
              className="glass border-border"
            />
            <Input
              type="number"
              placeholder="Max price"
              value={filters.priceRange.max || ''}
              onChange={(e) => setFilters({
                ...filters,
                priceRange: { ...filters.priceRange, max: Number(e.target.value) || 10000 }
              })}
              className="glass border-border"
            />
          </div>
          
          <div className="glass glass-hover rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setFilters(defaultFilters)}
              className="h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      }
      actions={
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none flex items-center gap-2"
          style={{
            background: 'rgba(75, 85, 99, 0.4)',
            border: '1px solid rgba(156, 163, 175, 0.4)',
            color: 'white',
            fontWeight: '500'
          }}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      }
    >
      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="mb-4 p-4 glass rounded-lg border border-blue-500/30 bg-blue-900/20">
          <div className="flex items-center justify-between">
            <p className="text-blue-300">
              {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
            </p>
            <div className="glass glass-hover rounded-lg p-1">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('duplicate')}
                  className="h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                  className="h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Deactivate
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="h-8 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Products Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="glass p-4 animate-pulse">
              <div className="h-40 bg-gray-700 rounded mb-3"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products?.data?.map((product: Product) => (
            <Card 
              key={product.id} 
              className={`glass p-4 hover:bg-gray-800/50 transition-all cursor-pointer ${
                selectedProducts.has(product.id) ? 'ring-2 ring-accent-blue' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selectedProducts.has(product.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newSelected = new Set(selectedProducts);
                    if (newSelected.has(product.id)) {
                      newSelected.delete(product.id);
                    } else {
                      newSelected.add(product.id);
                    }
                    setSelectedProducts(newSelected);
                  }}
                />
                <Badge variant={getStatusBadge(product.status) as any}>
                  {product.status.replace('-', ' ')}
                </Badge>
              </div>
              
              <div className="aspect-square bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                {product.images?.[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-500 text-sm">No Image</div>
                )}
              </div>
              
              <h3 className="font-semibold mb-1 text-white">{product.name}</h3>
              <p className="text-text-muted text-sm mb-2">{product.category}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-accent-blue">{formatCurrency(product.price)}</span>
                <span className="text-sm text-text-muted">Stock: {product.stock}</span>
              </div>
              
              <div className="glass glass-hover rounded-lg p-1 mt-3">
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-1 h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => handleViewProduct(product)}
                    title="View Product"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-1 h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => handleEditProduct(product)}
                    title="Edit Product"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="flex-1 h-8 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => handleDeleteProduct(product)}
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* List View Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-text-muted font-medium border-b border-border">
            <div className="col-span-1"></div>
            <div className="col-span-3">Product</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-1">Stock</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Actions</div>
          </div>
          
          {products?.data?.map((product: Product) => (
            <Card 
              key={product.id}
              className={`p-4 hover:bg-gray-800/50 transition-colors glass ${
                selectedProducts.has(product.id) ? 'ring-2 ring-accent-blue' : ''
              }`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => {
                      const newSelected = new Set(selectedProducts);
                      if (newSelected.has(product.id)) {
                        newSelected.delete(product.id);
                      } else {
                        newSelected.add(product.id);
                      }
                      setSelectedProducts(newSelected);
                    }}
                  />
                </div>
                
                <div className="col-span-3">
                  <p className="font-medium text-white">{product.name}</p>
                  <p className="text-sm text-text-muted">ID: {product.id.slice(0, 8)}...</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-white">{product.category}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="font-semibold text-accent-blue">{formatCurrency(product.price)}</p>
                </div>
                
                <div className="col-span-1">
                  <p className={`${product.stock < 10 ? 'text-red-400' : 'text-white'}`}>
                    {product.stock}
                  </p>
                </div>
                
                <div className="col-span-1">
                  <Badge variant={getStatusBadge(product.status) as any}>
                    {product.status.replace('-', ' ')}
                  </Badge>
                </div>
                
                <div className="col-span-2">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="glass border-border"
                      onClick={() => handleViewProduct(product)}
                      title="View Product"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="glass border-border"
                      onClick={() => handleEditProduct(product)}
                      title="Edit Product"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteProduct(product)}
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      <Pagination
        currentPage={filters.page}
        totalPages={Math.ceil((products?.total || 0) / filters.limit)}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />

      {/* Product Modals */}
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories || []}
        onSave={refetch}
      />
      
      <ProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        categories={categories || []}
        onSave={refetch}
      />
    </DashboardLayout>
  );
}