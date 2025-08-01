import { useState, useEffect, FormEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Category } from '@/shared/schema';
import { globalDesignSystem as theme } from '@/styles/design-system/theme';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  onCategoryCreated?: (category: Category) => void;
  onCategoryUpdated?: (category: Category) => void;
}

export function CategoryModal({ 
  isOpen, 
  onClose, 
  category, 
  onCategoryCreated, 
  onCategoryUpdated 
}: CategoryModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    displayOrder: 0,
    isActive: true,
    featuredImageUrl: '',
    seoTitle: '',
    seoDescription: '',
    customAttributes: {} as Record<string, any>
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        icon: category.icon || '',
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive ?? true,
        featuredImageUrl: category.featuredImageUrl || '',
        seoTitle: category.seoTitle || '',
        seoDescription: category.seoDescription || '',
        customAttributes: category.customAttributes || {}
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        displayOrder: 0,
        isActive: true,
        featuredImageUrl: '',
        seoTitle: '',
        seoDescription: '',
        customAttributes: {}
      });
    }
  }, [category, isOpen]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (category) {
        const updated = await apiRequest(`/api/admin/categories/${category.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        onCategoryUpdated?.(updated);
        toast({
          title: "Category Updated",
          description: "Category has been successfully updated."
        });
      } else {
        const created = await apiRequest('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        onCategoryCreated?.(created);
        toast({
          title: "Category Created",
          description: "New category has been successfully created."
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${category ? 'update' : 'create'} category. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          color: theme.colors.text.primary
        }}
      >
        <DialogHeader 
          className="border-b pb-4"
          style={{ borderColor: theme.colors.border.default }}
        >
          <DialogTitle style={{ color: theme.colors.text.primary }}>
            {category ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription style={{ color: theme.colors.text.secondary }}>
            {category ? 'Update category information and settings' : 'Create a new category for your products'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" style={{ color: theme.colors.text.secondary }}>Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  style={{ 
                    backgroundColor: theme.colors.bg.primary, 
                    borderColor: theme.colors.border.default, 
                    color: theme.colors.text.primary 
                  }}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="slug" style={{ color: theme.colors.text.secondary }}>Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  style={{ 
                    backgroundColor: theme.colors.bg.primary, 
                    borderColor: theme.colors.border.default, 
                    color: theme.colors.text.primary 
                  }}
                  placeholder="Auto-generated from name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" style={{ color: theme.colors.text.secondary }}>Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ 
                  backgroundColor: theme.colors.bg.primary, 
                  borderColor: theme.colors.border.default, 
                  color: theme.colors.text.primary 
                }}
                rows={3}
                placeholder="Brief description of this category"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon" style={{ color: theme.colors.text.secondary }}>Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  style={{ 
                    backgroundColor: theme.colors.bg.primary, 
                    borderColor: theme.colors.border.default, 
                    color: theme.colors.text.primary 
                  }}
                  placeholder="e.g., dumbbell, barbell"
                />
              </div>
              
              <div>
                <Label htmlFor="displayOrder" style={{ color: theme.colors.text.secondary }}>Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  style={{ 
                    backgroundColor: theme.colors.bg.primary, 
                    borderColor: theme.colors.border.default, 
                    color: theme.colors.text.primary 
                  }}
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive" style={{ color: theme.colors.text.secondary }}>Active Status</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          {/* SEO Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>SEO Information</h3>
            
            <div>
              <Label htmlFor="seoTitle" style={{ color: theme.colors.text.secondary }}>SEO Title</Label>
              <Input
                id="seoTitle"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                style={{ 
                  backgroundColor: theme.colors.bg.primary, 
                  borderColor: theme.colors.border.default, 
                  color: theme.colors.text.primary 
                }}
                placeholder="SEO optimized title for this category"
              />
            </div>

            <div>
              <Label htmlFor="seoDescription" style={{ color: theme.colors.text.secondary }}>SEO Description</Label>
              <Textarea
                id="seoDescription"
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                style={{ 
                  backgroundColor: theme.colors.bg.primary, 
                  borderColor: theme.colors.border.default, 
                  color: theme.colors.text.primary 
                }}
                rows={3}
                placeholder="Meta description for search engines"
              />
            </div>

            <div>
              <Label htmlFor="featuredImageUrl" style={{ color: theme.colors.text.secondary }}>Featured Image URL</Label>
              <Input
                id="featuredImageUrl"
                value={formData.featuredImageUrl}
                onChange={(e) => setFormData({ ...formData, featuredImageUrl: e.target.value })}
                style={{ 
                  backgroundColor: theme.colors.bg.primary, 
                  borderColor: theme.colors.border.default, 
                  color: theme.colors.text.primary 
                }}
                placeholder="URL for category featured image"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div 
            className="flex justify-end gap-3 pt-6 border-t"
            style={{ borderColor: theme.colors.border.default }}
          >
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}