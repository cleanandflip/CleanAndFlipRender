import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { CategoryModal } from '@/components/admin/CategoryModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Eye,
  EyeOff
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  productCount: number;
  order: number;
  createdAt: string;
}

export function CategoryManager() {
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'order',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-categories', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      const res = await fetch(`/api/admin/categories?${params}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    retry: 2
  });

  const categories = categoriesData?.categories || [];

  const reorderMutation = useMutation({
    mutationFn: async (reorderedCategories: Array<{ id: string; order: number }>) => {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ categories: reorderedCategories })
      });
      if (!res.ok) throw new Error('Failed to reorder categories');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({ title: "Categories reordered successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to reorder categories",
        variant: "destructive" 
      });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, updates }: { categoryId: string; updates: Partial<Category> }) => {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({ title: "Category updated successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update category",
        variant: "destructive" 
      });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({ title: "Category deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete category",
        variant: "destructive" 
      });
    }
  });

  const handleToggleActive = (category: Category) => {
    updateCategoryMutation.mutate({
      categoryId: category.id,
      updates: { isActive: !category.isActive }
    });
  };

  const handleViewCategory = (category: Category) => {
    toast({
      title: "Category Details",
      description: `${category.name} has ${category.productCount} products`,
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };



  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams({ format });
      const res = await fetch(`/api/admin/categories/export?${params}`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `categories-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ 
        title: "Export failed", 
        description: "Could not export categories",
        variant: "destructive" 
      });
    }
  };

  return (
    <DashboardLayout
      title="Category Management"
      description="Organize your product categories and structure"
      totalCount={categories?.length || 0}
      searchPlaceholder="Search categories..."
      onSearch={(query) => setFilters({ ...filters, search: query })}
      onRefresh={refetch}
      onExport={handleExport}
      isLoading={isLoading}
      filters={
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Drag and drop categories to reorder them. Categories with products cannot be deleted.
          </p>
          <div className="glass glass-hover rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ ...filters, search: '' })}
              className="h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Clear Search
            </Button>
          </div>
        </div>
      }
      actions={
        <div className="glass glass-hover rounded-lg p-1">
          <Button 
            variant="primary"
            size="sm"
            className="h-8 gap-2 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        {categories?.length === 0 ? (
          <Card className="glass themed-card p-8 text-center">
            <p className="text-text-muted">No categories found</p>
            <Button 
              className="btn-primary mt-4 gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Create your first category
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
            {categories?.map((category: Category) => (
              <div key={category.id} className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 group hover:scale-105">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full animate-pulse ${category.isActive ? 'bg-green-400 shadow-green-400/50' : 'bg-red-400 shadow-red-400/50'} shadow-lg`} />
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${category.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'} border ${category.isActive ? 'border-green-500/30' : 'border-red-500/30'}`}>
                      {category.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                      <DropdownMenuItem onClick={() => handleViewCategory(category)} className="text-gray-300 hover:text-white hover:bg-gray-800">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditCategory(category)} className="text-gray-300 hover:text-white hover:bg-gray-800">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Category
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(category)} className="text-gray-300 hover:text-white hover:bg-gray-800">
                        {category.isActive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                        {category.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCategory(category)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">{category.name}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{category.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    /{category.slug} • Position: {category.order}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-400 font-medium">Products</span>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-3 py-1 rounded-lg border border-blue-500/30">
                    <span className="text-lg font-bold text-white">{category.productCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  <div className="glass glass-hover rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCategory(category)}
                      title="View Category"
                      className="h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="glass glass-hover rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                      title="Edit Category"
                      className="h-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="glass glass-hover rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category)}
                      disabled={category.productCount > 0}
                      title={category.productCount > 0 ? 'Cannot delete - has products' : 'Delete Category'}
                      className="h-8 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Category Statistics */}
      {categories?.length > 0 && (
        <Card className="glass p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Category Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {categories?.filter((c: Category) => c.isActive).length || 0}
              </p>
              <p className="text-sm text-text-muted">Active Categories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {categories?.reduce((sum: number, c: Category) => sum + c.productCount, 0) || 0}
              </p>
              <p className="text-sm text-text-muted">Total Products</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {categories?.filter((c: Category) => c.productCount === 0).length || 0}
              </p>
              <p className="text-sm text-text-muted">Empty Categories</p>
            </div>
          </div>
        </Card>
      )}

      {/* Category Modals */}
      <CategoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory as any}
        onCategoryUpdated={() => {
          refetch();
          setIsEditModalOpen(false);
          setEditingCategory(null);
        }}
      />
      
      <CategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCategoryCreated={() => {
          refetch();
          setIsCreateModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
}