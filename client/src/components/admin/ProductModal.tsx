import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { globalDesignSystem as theme } from '@/styles/design-system/theme';
import { motion } from 'framer-motion';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any; // For editing
  categories: any[];
  onSave: () => void;
}

export function ProductModal({ isOpen, onClose, product, categories, onSave }: ProductModalProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    compareAtPrice: '',
    stock: '',
    categoryId: '',
    description: '',
    shortDescription: '',
    images: [] as string[],
    features: [] as string[],
    specifications: {} as Record<string, string>,
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    isActive: true,
    isFeatured: false,
    tags: [] as string[],
    seoTitle: '',
    seoDescription: '',
    slug: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        price: product.price?.toString() || '',
        compareAtPrice: product.compareAtPrice?.toString() || '',
        stock: product.stock?.toString() || '',
        categoryId: product.categoryId || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        images: product.images || [],
        features: product.features || [],
        specifications: product.specifications || {},
        weight: product.weight?.toString() || '',
        dimensions: product.dimensions || { length: '', width: '', height: '' },
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
        tags: product.tags || [],
        seoTitle: product.seoTitle || '',
        seoDescription: product.seoDescription || '',
        slug: product.slug || ''
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        sku: '',
        price: '',
        compareAtPrice: '',
        stock: '',
        categoryId: '',
        description: '',
        shortDescription: '',
        images: [],
        features: [],
        specifications: {},
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        isActive: true,
        isFeatured: false,
        tags: [],
        seoTitle: '',
        seoDescription: '',
        slug: ''
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock || !formData.categoryId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const url = product 
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products';
      
      const method = product ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
          stock: parseInt(formData.stock),
          weight: formData.weight ? parseFloat(formData.weight) : null
        })
      });

      if (res.ok) {
        onSave();
        onClose();
        toast({ 
          title: product ? 'Product updated' : 'Product created',
          description: 'Changes saved successfully'
        });
      } else {
        const error = await res.json();
        toast({ 
          title: 'Error',
          description: error.message || 'Failed to save product',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ 
        title: 'Error',
        description: 'Failed to save product',
        variant: 'destructive'
      });
    }
  };

  const addFeature = () => {
    const feature = prompt('Enter feature:');
    if (feature) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
  };

  const addSpecification = () => {
    const key = prompt('Specification name:');
    const value = prompt('Specification value:');
    if (key && value) {
      setFormData(prev => ({
        ...prev,
        specifications: { ...prev.specifications, [key]: value }
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
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
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription style={{ color: theme.colors.text.secondary }}>
            {product ? 'Update product information and settings' : 'Create a new product for your store'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label 
                  htmlFor="name" 
                  style={{ color: theme.colors.text.secondary }}
                >
                  Product Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    backgroundColor: theme.colors.bg.primary,
                    borderColor: theme.colors.border.default,
                    color: theme.colors.text.primary
                  }}
                />
              </div>
              
              <div>
                <Label 
                  htmlFor="sku"
                  style={{ color: theme.colors.text.secondary }}
                >
                  SKU
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Auto-generated if empty"
                  style={{
                    backgroundColor: theme.colors.bg.primary,
                    borderColor: theme.colors.border.default,
                    color: theme.colors.text.primary
                  }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category" style={{ color: theme.colors.text.secondary }}>Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger style={{ backgroundColor: theme.colors.bg.primary, borderColor: theme.colors.border.default, color: theme.colors.text.primary }}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description" style={{ color: theme.colors.text.secondary }}>Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ backgroundColor: theme.colors.bg.primary, borderColor: theme.colors.border.default, color: theme.colors.text.primary }}
                rows={4}
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="space-y-4">
            <h3 style={{ color: theme.colors.text.primary }} className="text-lg font-semibold">Pricing & Inventory</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price" style={{ color: theme.colors.text.secondary }}>Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ backgroundColor: theme.colors.bg.primary, borderColor: theme.colors.border.default, color: theme.colors.text.primary }}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="compareAtPrice" style={{ color: theme.colors.text.secondary }}>Compare at Price</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  style={{ backgroundColor: theme.colors.bg.primary, borderColor: theme.colors.border.default, color: theme.colors.text.primary }}
                  placeholder="Original price"
                />
              </div>
              
              <div>
                <Label htmlFor="stock" style={{ color: theme.colors.text.secondary }}>Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  style={{ backgroundColor: theme.colors.bg.primary, borderColor: theme.colors.border.default, color: theme.colors.text.primary }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Product Status */}
          <div className="space-y-4">
            <h3 style={{ color: theme.colors.text.primary }} className="text-lg font-semibold">Product Status</h3>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive" style={{ color: theme.colors.text.secondary }}>Active</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
                <Label htmlFor="isFeatured" style={{ color: theme.colors.text.secondary }}>Featured</Label>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 style={{ color: theme.colors.text.primary }} className="text-lg font-semibold">Features</h3>
              <Button type="button" size="sm" variant="outline" onClick={addFeature}>
                <Plus className="w-4 h-4 mr-1" />
                Add Feature
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input 
                    value={feature} 
                    readOnly 
                    style={{ backgroundColor: theme.colors.bg.primary, borderColor: theme.colors.border.default, color: theme.colors.text.primary }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        features: prev.features.filter((_, i) => i !== idx)
                      }));
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: theme.colors.border.default }}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}