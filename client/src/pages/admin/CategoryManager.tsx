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
          <Card className="glass p-8 text-center">
            <p className="text-text-muted">No categories found</p>
            <Button 
              className="mt-4 gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Create your first category
            </Button>
          </Card>
        ) : (
          categories?.map((category: Category) => (
            <Card key={category.id} className="glass p-4">
              <div className="flex items-center gap-4">
                {/* Drag Handle */}
                <GripVertical className="w-4 h-4 text-text-muted cursor-grab hover:text-white" />
                
                {/* Category Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white">{category.name}</h3>
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {category.productCount} products
                    </Badge>
                  </div>
                  {category.description && (
                    <p className="text-sm text-text-muted mt-1">{category.description}</p>
                  )}
                  <p className="text-xs text-text-muted mt-1">
                    Slug: /{category.slug} • Order: {category.order}
                  </p>
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
        category={editingCategory}
        onSuccess={() => {
          refetch();
          setIsEditModalOpen(false);
          setEditingCategory(null);
        }}
      />
      
      <CategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsCreateModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
}