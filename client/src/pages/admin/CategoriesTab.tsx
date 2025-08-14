// CATEGORIES TAB WITH COMPLETE LIVE SYNC
import { useState, useEffect } from 'react';
import { FolderTree, Plus, Wifi, WifiOff } from 'lucide-react';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { EnhancedCategoryModal } from '@/components/admin/modals/EnhancedCategoryModal';
import { useWebSocketState } from "@/hooks/useWebSocketState";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export function CategoriesTab() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ready = useWebSocketState();
  const queryClient = useQueryClient();

  // Fetch categories with React Query
  const {
    data: categoriesData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/categories', {
          credentials: 'include'
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        console.log('Categories API response:', data);
        return data;
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        throw error;
      }
    }
  });

  // Extract categories array from API response
  const categories = categoriesData?.categories || [];
  const stats = categoriesData?.stats || { active: 0, empty: 0, total: 0 };

  // Setup live sync with new typed WebSocket system
  useEffect(() => {
    return subscribe("category:update", (msg) => {
      console.log('🔄 Live sync: Refreshing categories', msg);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      
      // Trigger animation for data table
      const tableElement = document.querySelector('[data-table="categories"]');
      if (tableElement) {
        tableElement.classList.add('animate-slideUp');
        setTimeout(() => tableElement.classList.remove('animate-slideUp'), 500);
      }
    });
  }, [subscribe, queryClient]);

  // Handle category actions
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        toast({
          title: "Category Deleted",
          description: `${category.name} has been removed`,
        });

        // Server publishes WebSocket updates automatically

        refetch();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: 'Category Name',
      render: (category: Category) => (
        <div className="font-medium text-white">{category.name}</div>
      ),
      sortable: true
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (category: Category) => (
        <code className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
          {category.slug}
        </code>
      )
    },
    {
      key: 'productCount',
      label: 'Products',
      render: (category: Category) => (
        <span className="font-mono text-blue-400">{category.productCount || 0}</span>
      ),
      sortable: true
    },
    {
      key: 'displayOrder',
      label: 'Order',
      render: (category: Category) => (
        <span className="text-gray-400">{category.displayOrder}</span>
      ),
      sortable: true
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (category: Category) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
          category.isActive
            ? 'bg-green-500/20 text-green-400'
            : 'bg-gray-500/20 text-gray-400'
        }`}>
          {category.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  const activeCategories = categories.filter((c: Category) => c.isActive);
  const totalProducts = categories.reduce((sum: number, c: Category) => sum + (c.productCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <UnifiedMetricCard
          title="Total Categories"
          value={categories.length}
          icon={FolderTree}
          change={{ value: 2, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Active Categories"
          value={activeCategories.length}
          icon={FolderTree}
          change={{ value: 1, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Total Products"
          value={totalProducts}
          icon={FolderTree}
        />
        <UnifiedMetricCard
          title="Avg Products/Category"
          value={Math.round(totalProducts / (categories.length || 1))}
          icon={FolderTree}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Category Management</h2>
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
          <p className="text-gray-400 mt-1">Organize your products into categories</p>
        </div>
        <UnifiedButton
          variant="primary"
          icon={Plus}
          onClick={handleAddCategory}
        >
          Add Category
        </UnifiedButton>
      </div>

      {/* Table */}
      <div data-table="categories">
        <UnifiedDataTable
          data={categories}
          columns={columns}
          searchPlaceholder="Search categories..."
          onSearch={setSearchQuery}
          onRefresh={refetch}
          loading={isLoading}
          actions={{
            onView: handleEditCategory,
            onEdit: handleEditCategory,
            onDelete: handleDeleteCategory
          }}
          pagination={{
            currentPage: 1,
            totalPages: Math.ceil(categories.length / 20) || 1,
            onPageChange: (page) => console.log('Page:', page)
          }}
        />
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <EnhancedCategoryModal
          category={selectedCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setSelectedCategory(null);
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
