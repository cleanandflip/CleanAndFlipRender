// UNIFIED CATEGORIES TAB
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Grid, Plus, Package, Eye, Edit, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { useToast } from '@/hooks/use-toast';
import { AddCategoryModal } from '@/components/admin/Modals';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categoriesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-categories', searchQuery],
    queryFn: async () => {
      const res = await fetch('/api/admin/categories', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  const categories: Category[] = categoriesData?.categories || [];

  // Action handlers
  const handleView = (category: Category) => {
    console.log('View:', category);
    window.open(`/category/${category.slug}`, '_blank');
    toast({
      title: "Opening Category",
      description: `Opening ${category.name} in new tab`,
    });
  };

  const handleEdit = (category: Category) => {
    console.log('Edit:', category);
    setEditingCategory(category);
    setShowEditModal(true);
    toast({
      title: "Edit Mode",
      description: `Opening edit form for ${category.name}`,
    });
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        refetch(); // Refresh the data
        toast({
          title: "Category Deleted",
          description: `${category.name} has been permanently deleted`,
        });
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportCategories = async () => {
    try {
      // Generate CSV data for categories
      const csvHeaders = 'Name,Slug,Product Count,Status,Created Date\n';
      const csvData = categories.map((c: Category) => 
        `"${c.name}","${c.slug}","${c.productCount}","${c.isActive ? 'Active' : 'Inactive'}","${new Date(c.createdAt).toLocaleDateString()}"`
      ).join('\n');
      
      const fullCsv = csvHeaders + csvData;
      const blob = new Blob([fullCsv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `categories-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Exported ${categories.length} categories to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export categories data",
        variant: "destructive",
      });
    }
  };

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
          onClick={() => setShowAddModal(true)}
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
        onExport={handleExportCategories}
        loading={isLoading}
        actions={{
          onView: handleView,
          onEdit: handleEdit,
          onDelete: handleDelete
        }}
        pagination={{
          currentPage: 1,
          totalPages: Math.ceil(categories.length / 20) || 1,
          onPageChange: (page) => console.log('Page:', page)
        }}
      />

      {/* Modals */}
      {showAddModal && (
        <AddCategoryModal 
          onClose={() => setShowAddModal(false)} 
          onSave={refetch}
        />
      )}
    </div>
  );
}