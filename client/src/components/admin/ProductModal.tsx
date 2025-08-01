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
  productId?: string | null; // Pass ID instead of full object
  categories: any[];
  onSave: () => void;
}

export function ProductModal({ isOpen, onClose, productId, categories, onSave }: ProductModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const initialFormState = {
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
  };

  const [formData, setFormData] = useState(initialFormState);

  // CRITICAL: Load product data when modal opens
  useEffect(() => {
    if (isOpen && productId) {
      loadProductData();
    } else if (isOpen && !productId) {
      // Reset form for new product
      resetForm();
    }
  }, [isOpen, productId]);

  // Debug logging to track form data updates
  useEffect(() => {
    console.log('ProductModal Form Debug:', {
      isOpen,
      productId,
      formStock: formData.stock,
      stockType: typeof formData.stock,
      allFormData: formData
    });
  }, [isOpen, productId, formData.stock]);

  const loadProductData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading product with ID:', productId);
      
      const response = await fetch(`/api/admin/products/${productId}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to load product: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received product data:', data);
      
      // Populate form with fetched data
      setFormData({
        name: data.name || '',
        sku: data.sku || '',
        price: data.price?.toString() || '',
        compareAtPrice: data.compareAtPrice?.toString() || '',
        stock: (data.stockQuantity || data.stock || 0).toString(), // CRITICAL FIX: Backend uses stockQuantity
        categoryId: data.categoryId || '',
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        images: data.images || [],
        features: data.features || [],
        specifications: data.specifications || {},
        weight: data.weight?.toString() || '',
        dimensions: data.dimensions || { length: '', width: '', height: '' },
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        tags: data.tags || [],
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
        slug: data.slug || ''
      });
      
    } catch (err) {
      console.error('Error loading product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load product details';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!formData.name || !formData.price || !formData.stock || !formData.categoryId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const url = productId 
        ? `/api/admin/products/${productId}`
        : '/api/admin/products';
      
      const method = productId ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        stockQuantity: parseInt(formData.stock), // CRITICAL FIX: Backend expects stockQuantity
        weight: formData.weight ? parseFloat(formData.weight) : null,
        isActive: formData.isActive, // CRITICAL: Ensure this is sent to server
        isFeatured: formData.isFeatured
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({ 
          title: productId ? 'Product updated' : 'Product created',
          description: 'Changes saved successfully'
        });
        
        // CRITICAL: Call parent's onSave to refresh the list
        await onSave();
        
        // Close modal and reset form
        handleClose();
      } else {
        const error = await res.json();
        toast({ 
          title: 'Error',
          description: error.message || 'Failed to save product',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to save product',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear form data when modal closes
  const handleClose = () => {
    resetForm();
    onClose();
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

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
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

  const removeSpecification = (key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return { ...prev, specifications: newSpecs };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
            {productId ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription style={{ color: theme.colors.text.secondary }}>
            {productId ? 'Update product information and inventory' : 'Create a new product for your store'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2" style={{ color: theme.colors.text.secondary }}>
              Loading product details...
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 text-center border rounded" style={{ 
            borderColor: theme.colors.border.default,
            backgroundColor: theme.colors.bg.secondary 
          }}>
            <p className="text-red-500 mb-4">Error: {error}</p>
            <Button onClick={() => loadProductData()} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" style={{ color: theme.colors.text.secondary }}>
                  Product Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ 
                    backgroundColor: theme.colors.bg.primary, 
                    borderColor: theme.colors.border.default, 
                    color: theme.colors.text.primary 
                  }}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="sku" style={{ color: theme.colors.text.secondary }}>
                  SKU
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  style={{ 
                    backgroundColor: theme.colors.bg.primary, 
                    borderColor: theme.colors.border.default, 
                    color: theme.colors.text.primary 
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price" style={{ color: theme.colors.text.secondary }}>
                  Price *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ 
                    backgroundColor: theme.colors.bg.primary, 
                    borderColor: theme.colors.border.default, 
                    color: theme.colors.text.primary 
                  }}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="compareAtPrice" style={{ color: theme.colors.text.secondary }}>
                  Compare Price
                </Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  style={{ 
                    backgroundColor: theme.colors.bg.primary, 
                    borderColor: theme.colors.border.default, 
                    color: theme.colors.text.primary 
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="stock" style={{ color: theme.colors.text.secondary }}>
                  Stock *
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  style={{ 
                    backgroundColor: theme.colors.bg.primary, 
                    borderColor: theme.colors.border.default, 
                    color: theme.colors.text.primary 
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="categoryId" style={{ color: theme.colors.text.secondary }}>
                Category *
              </Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger 
                  style={{ 
                    backgroundColor: theme.colors.bg.primary, 
                    borderColor: theme.colors.border.default, 
                    color: theme.colors.text.primary 
                  }}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description" style={{ color: theme.colors.text.secondary }}>
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ 
                  backgroundColor: theme.colors.bg.primary, 
                  borderColor: theme.colors.border.default, 
                  color: theme.colors.text.primary 
                }}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive" style={{ color: theme.colors.text.secondary }}>
                  Active Status
                </Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured" style={{ color: theme.colors.text.secondary }}>
                  Featured Product
                </Label>
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                Features
              </h3>
              <Button type="button" onClick={addFeature} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...formData.features];
                      newFeatures[index] = e.target.value;
                      setFormData({ ...formData, features: newFeatures });
                    }}
                    style={{ 
                      backgroundColor: theme.colors.bg.primary, 
                      borderColor: theme.colors.border.default, 
                      color: theme.colors.text.primary 
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => removeFeature(index)}
                    size="sm"
                    variant="destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div 
            className="flex justify-end gap-3 pt-6 border-t"
            style={{ borderColor: theme.colors.border.default }}
          >
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (productId ? 'Update Product' : 'Create Product')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}