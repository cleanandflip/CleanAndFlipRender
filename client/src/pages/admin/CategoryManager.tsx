import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UnifiedDashboardCard } from '@/components/admin/UnifiedDashboardCard';
import { UnifiedStatCard } from '@/components/admin/UnifiedStatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Eye,
  EyeOff,
  Grid3X3,
  Package
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
  console.log('🔴 CategoryManager RENDERED at', new Date().toISOString());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-categories', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({ search: searchTerm });
      const res = await fetch(`/api/admin/categories?${params}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    retry: 2
  });

  const categories = categoriesData?.categories || [];
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c: Category) => c.isActive).length;
  const totalProducts = categories.reduce((sum: number, c: Category) => sum + c.productCount, 0);

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
    }
  });

  const handleToggleActive = (category: Category) => {
    updateCategoryMutation.mutate({
      categoryId: category.id,
      updates: { isActive: !category.isActive }
    });
  };

  const handleDeleteCategory = (category: Category) => {
    if (category.productCount > 0) {
      toast({
        title: "Cannot delete category",
        description: "This category has products assigned to it",
        variant: "destructive"
      });
      return;
    }
    
    if (confirm(`Delete category "${category.name}"?`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  return (
    <div className="space-y-8">
      {/* PROFESSIONAL HEADER SECTION */}
      <UnifiedDashboardCard className="bg-gradient-to-r from-gray-800/50 to-gray-700/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Category Management
            </h2>
            <p className="text-gray-400">Organize your product categories and structure</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/25">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </UnifiedDashboardCard>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UnifiedStatCard
          title="Total Categories"
          value={totalCategories}
          icon={Grid3X3}
          gradient="from-blue-500 to-cyan-500"
        />
        <UnifiedStatCard
          title="Active Categories"
          value={activeCategories}
          icon={Eye}
          gradient="from-green-500 to-emerald-500"
        />
        <UnifiedStatCard
          title="Total Products"
          value={totalProducts}
          icon={Package}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* SEARCH AND FILTERS */}
      <UnifiedDashboardCard>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            Refresh
          </Button>
        </div>
      </UnifiedDashboardCard>

      {/* CATEGORIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((category: Category) => (
          <UnifiedDashboardCard key={category.id} className="hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group hover:scale-[1.02]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full animate-pulse ${category.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                <Badge 
                  variant={category.isActive ? "default" : "secondary"}
                  className={category.isActive 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }
                >
                  {category.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {category.name}
              </h3>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                {category.description || 'No description provided'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-400">
                  {category.productCount} products
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleActive(category)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {category.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteCategory(category)}
                disabled={category.productCount > 0}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </UnifiedDashboardCard>
        ))}
      </div>

      {categories.length === 0 && !isLoading && (
        <UnifiedDashboardCard className="text-center py-12">
          <Grid3X3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Categories Found</h3>
          <p className="text-gray-400 mb-6">Create your first category to get started</p>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </UnifiedDashboardCard>
      )}
    </div>
  );
}