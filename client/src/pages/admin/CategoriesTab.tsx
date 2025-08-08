// UNIFIED CATEGORIES TAB
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Grid, Plus, Package, Eye, Edit, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';

interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  isActive: boolean;
  createdAt: string;
}

export function CategoriesTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-categories', searchQuery],
    queryFn: async () => {
      const res = await fetch('/api/admin/categories', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  const categories: Category[] = categoriesData?.categories || [];

  const columns = [
    {
      key: 'name',
      label: 'Category',
      render: (category: Category) => (
        <div>
          <p className="font-medium text-white">{category.name}</p>
          <p className="text-sm text-gray-500">{category.description}</p>
        </div>
      )
    },
    {
      key: 'productCount',
      label: 'Products',
      render: (category: Category) => (
        <span className="font-medium text-blue-400">{category.productCount}</span>
      ),
      sortable: true
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (category: Category) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          category.isActive 
            ? "bg-green-500/20 text-green-400" 
            : "bg-gray-500/20 text-gray-400"
        )}>
          {category.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (category: Category) => (
        <span className="text-gray-400">
          {new Date(category.createdAt).toLocaleDateString()}
        </span>
      ),
      sortable: true
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UnifiedMetricCard
          title="Total Categories"
          value={categories.length}
          icon={Grid}
          change={{ value: 5, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Active Categories"
          value={categories.filter(c => c.isActive).length}
          icon={Grid}
          change={{ value: 3, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Total Products"
          value={categories.reduce((sum, c) => sum + c.productCount, 0)}
          icon={Package}
          change={{ value: 15, label: 'from last month' }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Category Management</h2>
          <p className="text-gray-400 mt-1">Organize your product catalog</p>
        </div>
        <UnifiedButton
          variant="primary"
          icon={Plus}
          onClick={() => {/* Add category modal */}}
        >
          Add Category
        </UnifiedButton>
      </div>

      {/* Table */}
      <UnifiedDataTable
        data={categories}
        columns={columns}
        searchPlaceholder="Search categories..."
        onSearch={setSearchQuery}
        onRefresh={refetch}
        onExport={() => console.log('Export categories')}
        loading={isLoading}
        actions={{
          onView: (category) => console.log('View category:', category),
          onEdit: (category) => console.log('Edit category:', category),
          onDelete: (category) => console.log('Delete category:', category)
        }}
        pagination={{
          currentPage: 1,
          totalPages: Math.ceil(categories.length / 20) || 1,
          onPageChange: (page) => console.log('Page:', page)
        }}
      />
    </div>
  );
}