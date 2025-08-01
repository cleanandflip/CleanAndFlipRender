import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { ProductModal } from '@/components/admin/ProductModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Eye, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/submissionHelpers';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  stockQuantity: number;
  category: string;
  categoryId: string;
  status: 'active' | 'inactive' | 'out-of-stock';
  createdAt: string;
  updatedAt: string;
  images?: string[];
  isActive: boolean;
  isFeatured: boolean;
}

export function ProductsManagerNew() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  
  // Fetch products with force refresh and comprehensive caching prevention
  const fetchProducts = useCallback(async () => {
    const timestamp = Date.now();
    const url = `/api/admin/products?_t=${timestamp}&_refresh=${forceRefreshKey}`;
    
    console.log('Fetching products from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const data = await response.json();
    console.log('Products fetched:', data);
    return data;
  }, [forceRefreshKey]);
  
  const { data: productsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-products', forceRefreshKey],
    queryFn: fetchProducts,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
  
  const { data: categories } = useQuery({
    queryKey: ['admin-categories', forceRefreshKey],
    queryFn: async () => {
      const res = await fetch('/api/admin/categories', { 
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    staleTime: 0,
    gcTime: 0
  });
  
  const handleEditProduct = (product: Product) => {
    console.log('Editing product:', product);
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };
  
  const handleProductSave = async () => {
    console.log('Product saved, refreshing list...');
    
    // Method 1: Clear all caches
    await queryClient.cancelQueries({ queryKey: ['admin-products'] });
    queryClient.removeQueries({ queryKey: ['admin-products'] });
    
    // Method 2: Force refresh key change
    setForceRefreshKey(prev => prev + 1);
    
    // Method 3: Manual refetch after delay
    setTimeout(async () => {
      await refetch();
      
      // Method 4: If still not working, reload the entire page data
      const freshData = await fetchProducts();
      queryClient.setQueryData(['admin-products', forceRefreshKey], freshData);
    }, 300);
    
    // Close modals
    setIsEditModalOpen(false);
    setIsCreateModalOpen(false);
    setEditingProduct(null);
    
    // Show success
    toast({
      title: 'Success',
      description: 'Product updated successfully'
    });
  };
  
  const handleRefresh = async () => {
    console.log('Manual refresh triggered');
    setForceRefreshKey(prev => prev + 1);
    await refetch();
  };
  
  const handleViewProduct = (product: Product) => {
    window.open(`/products/${product.id}`, '_blank');
  };
  
  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Delete "${product.name}"?`)) {
      try {
        const res = await fetch(`/api/admin/products/${product.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          await handleProductSave(); // Use same refresh logic
          toast({ title: "Product deleted successfully" });
        }
      } catch (error) {
        toast({ title: "Error deleting product", variant: "destructive" });
      }
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
  
  // Debug: Log product data
  console.log('Current products data:', productsData);
  
  return (
    <DashboardLayout
      title="Product Management - Enhanced"
      description="Manage your Clean & Flip inventory with state sync"
      totalCount={productsData?.data?.length || 0}
      searchPlaceholder="Search products by name, SKU, or category..."
      onSearch={() => {}} // Simplified for now
      onRefresh={handleRefresh}
      onExport={() => {}} // Simplified for now
      viewMode="list"
      currentView="list"
      onViewChange={() => {}}
      isLoading={isLoading}
      activeFiltersCount={0}
      sortOptions={[]}
      filters={<div>No filters for now</div>}
      actions={
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            className="gap-2 glass border-border"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button 
            className="gap-2 bg-accent-blue hover:bg-blue-600"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      }
    >
      {/* Debug Info */}
      <div className="bg-gray-800 p-4 rounded-lg text-xs mb-6">
        <p className="text-yellow-400 font-semibold">Debug Info:</p>
        <p className="text-white">Refresh Key: {forceRefreshKey}</p>
        <p className="text-white">Products Count: {productsData?.data?.length || 0}</p>
        <p className="text-white">Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p className="text-white">Last Update: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-2">
          {productsData?.data?.map((product: Product) => (
            <Card
              key={`${product.id}-${product.updatedAt}`} // Include updatedAt in key for force re-render
              className="glass p-4 hover:bg-gray-800/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{product.name}</h3>
                  <p className="text-sm text-gray-400">
                    SKU: {product.sku || 'N/A'} • Category: {product.category || product.categoryId}
                  </p>
                  <p className="text-xs text-gray-500">
                    Updated: {new Date(product.updatedAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-accent-blue">
                    {formatCurrency(product.price)}
                  </span>
                  <Badge 
                    variant={product.stock > 0 ? 'secondary' : 'destructive'}
                    className="px-3 py-1"
                  >
                    {product.stock} in stock
                  </Badge>
                  <Badge 
                    variant={product.isActive ? 'secondary' : 'outline'}
                    className="px-3 py-1"
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  
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

      {/* Product Modals with Enhanced State Management */}
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={Array.isArray(categories) ? categories : []}
        onSave={handleProductSave}
      />
      
      <ProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        categories={Array.isArray(categories) ? categories : []}
        onSave={handleProductSave}
      />
    </DashboardLayout>
  );
}