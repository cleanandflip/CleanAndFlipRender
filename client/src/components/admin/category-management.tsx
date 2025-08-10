import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import CategoryFilterConfig from "@/components/admin/category-filter-config";
import { apiRequest, broadcastProductUpdate } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  GripVertical,
  Eye,
  EyeOff,
  Upload
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
  filterConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  imageUrl?: string;
  filterConfig?: Record<string, any>;
}

function CategoryEditModal({ 
  category, 
  open, 
  onOpenChange 
}: { 
  category?: Category; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    isActive: category?.isActive ?? true,
    imageUrl: category?.imageUrl || "",
    filterConfig: category?.filterConfig || {}
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(category?.imageUrl || "");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData & { image?: File }) => {
      const formDataToSend = new FormData();
      formDataToSend.append('name', data.name);
      formDataToSend.append('slug', data.slug);
      formDataToSend.append('description', data.description);
      formDataToSend.append('is_active', data.isActive.toString());
      
      if (data.image) {
        formDataToSend.append('image', data.image);
      }
      
      if (category?.imageUrl && !data.image) {
        formDataToSend.append('existing_image_url', category.imageUrl);
      }

      const url = category 
        ? `/api/admin/categories/${category.id}` 
        : '/api/admin/categories';
      
      const method = category ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formDataToSend,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      broadcastProductUpdate('categories', 'update', { action: 'category_update' });
      toast({
        title: "Success",
        description: `Category ${category ? 'updated' : 'created'} successfully`,
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, image: imageFile || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            {category ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Barbells"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g., barbells"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="w-20 h-20 rounded-lg overflow-hidden glass">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="glass border-2 border-dashed border-border border-primary rounded-lg p-4 text-center hover:bg-white/5 transition-colors">
                    <Upload className="mx-auto mb-2 text-text-muted" size={24} />
                    <p className="text-sm text-text-muted">
                      Click to upload category image
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this category..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="is-active">Active (show on homepage)</Label>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saveMutation.isPending}
              className="bg-accent-blue hover:bg-blue-500"
            >
              {saveMutation.isPending ? 'Saving...' : category ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>

        {/* Category Filter Configuration */}
        <CategoryFilterConfig 
          category={{ ...category, filterConfig: formData.filterConfig }}
          onUpdate={(filters) => setFormData(prev => ({ ...prev, filterConfig: filters }))}
        />
      </DialogContent>
    </Dialog>
  );
}

export default function CategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/categories', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    refetchInterval: 30000
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      broadcastProductUpdate('categories', 'delete', { action: 'category_delete' });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ categoryId, isActive }: { categoryId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/categories/${categoryId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to toggle category status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      broadcastProductUpdate('categories', 'update', { action: 'category_toggle' });
    }
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    if (category.productCount > 0) {
      toast({
        title: "Cannot Delete",
        description: `Category "${category.name}" has ${category.productCount} products. Move or delete products first.`,
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Delete category "${category.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const handleToggleActive = (category: Category) => {
    toggleActiveMutation.mutate({ 
      categoryId: category.id, 
      isActive: !category.isActive 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-bebas text-2xl">CATEGORY MANAGEMENT</h2>
        </div>
        <Card className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
            <p className="text-text-secondary mt-4">Loading categories...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bebas text-2xl">CATEGORY MANAGEMENT</h2>
        <Button
          onClick={() => {
            setEditingCategory(undefined);
            setIsModalOpen(true);
          }}
          className="bg-accent-blue hover:bg-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-text-muted cursor-grab" />
                    <span className="text-sm">{category.displayOrder}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-12 h-12 rounded-lg overflow-hidden glass">
                    {category.imageUrl ? (
                      <img 
                        src={category.imageUrl} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-text-muted" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-text-secondary">{category.slug}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {category.productCount} items
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? "default" : "destructive"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(category)}
                      disabled={toggleActiveMutation.isPending}
                    >
                      {category.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(category)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CategoryEditModal
        category={editingCategory}
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingCategory(undefined);
          }
        }}
      />
    </div>
  );
}