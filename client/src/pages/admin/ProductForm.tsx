import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  stockQuantity: number;
  weight: number;
  condition: string;
  brand: string;
  images: File[];
}

export function ProductForm() {
  const [, params] = useParams();
  const id = params?.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    stockQuantity: 1,
    weight: 0,
    condition: 'like_new',
    brand: '',
    images: []
  });
  
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  // Load categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Load existing product data if editing
  const { data: product } = useQuery({
    queryKey: ['/api/products', id],
    enabled: isEdit,
  });
  
  // Update form when product loads
  useEffect(() => {
    if (product && isEdit) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        categoryId: product.categoryId || '',
        stockQuantity: product.stockQuantity || 1,
        weight: product.weight || 0,
        condition: product.condition || 'like_new',
        brand: product.brand || '',
        images: []
      });
      setImagePreview(product.images || []);
    }
  }, [product, isEdit]);
  
  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = 6;
    
    if (files.length > maxImages) {
      toast({ title: "Too many images", description: `Maximum ${maxImages} images allowed` });
      return;
    }
    
    setFormData({ ...formData, images: files });
    
    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };
  
  // Remove image preview
  const removeImage = (index: number) => {
    setImagePreview(prev => prev.filter((_, i) => i !== index));
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };
  
  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = isEdit 
        ? `/api/admin/products/${id}` 
        : '/api/admin/products';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        body: data,
        credentials: 'include'
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to save product');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: isEdit ? 'Product updated successfully!' : 'Product created successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      navigate('/admin');
    },
    onError: (error) => {
      toast({ title: "Error", description: 'Failed to save product: ' + error.message });
      console.error(error);
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.brand || !formData.categoryId || formData.price <= 0) {
      toast({ title: "Validation Error", description: "Please fill in all required fields" });
      return;
    }
    
    // Create FormData for multipart upload
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'images') {
        formData.images.forEach(image => {
          data.append('images', image);
        });
      } else {
        data.append(key, value.toString());
      }
    });
    
    submitMutation.mutate(data);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Product' : 'Create New Product'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Rogue Ohio Power Bar"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  placeholder="e.g., Rogue Fitness"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Detailed product description..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Pricing & Inventory */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({...formData, stockQuantity: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Category & Condition */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Category & Condition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="condition">Condition *</Label>
                <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="needs_repair">Needs Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Images */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="images">Upload Images (Max 6)</Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: JPG, PNG, WebP. Max 5MB per image.
              </p>
            </div>
            
            {/* Image Previews */}
            {imagePreview.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreview.map((src, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={src}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitMutation.isPending ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}