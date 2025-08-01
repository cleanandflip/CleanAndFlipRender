import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { Pagination } from '@/components/admin/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/submissionHelpers';

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
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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
        console.log('PDF export data:', data);
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
            <SelectTrigger className="glass border-glass-border">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="glass border-glass-border">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="barbells">Barbells</SelectItem>
              <SelectItem value="plates">Plates</SelectItem>
              <SelectItem value="dumbbells">Dumbbells</SelectItem>
              <SelectItem value="racks">Racks & Storage</SelectItem>
              <SelectItem value="cardio">Cardio Equipment</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters({ ...filters, status: v, page: 1 })}
          >
            <SelectTrigger className="glass border-glass-border">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="glass border-glass-border">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
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
              className="glass border-glass-border"
            />
            <Input
              type="number"
              placeholder="Max price"
              value={filters.priceRange.max || ''}
              onChange={(e) => setFilters({
                ...filters,
                priceRange: { ...filters.priceRange, max: Number(e.target.value) || 10000 }
              })}
              className="glass border-glass-border"
            />
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setFilters(defaultFilters)}
            className="glass border-glass-border"
          >
            Clear Filters
          </Button>
        </div>
      }
      actions={
        <Button className="gap-2 bg-accent-blue hover:bg-blue-600">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      }
    >
      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="mb-4 p-4 glass rounded-lg border border-blue-500/30 bg-blue-900/20">
          <div className="flex items-center justify-between">
            <p className="text-blue-300">
              {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('duplicate')}
                className="glass border-glass-border"
              >
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
                className="glass border-glass-border"
              >
                Deactivate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                Delete
              </Button>
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
              
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1 glass border-glass-border">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="flex-1 glass border-glass-border">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" className="flex-1">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* List View Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-text-muted font-medium border-b border-glass-border">
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
                    <Button size="sm" variant="outline" className="glass border-glass-border">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="glass border-glass-border">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive">
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
    </DashboardLayout>
  );
}