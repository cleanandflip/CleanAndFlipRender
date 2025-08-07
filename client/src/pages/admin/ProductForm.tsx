import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceInput } from '@/components/ui/price-input';
import { UnifiedDropdown } from '@/components/ui/unified-dropdown';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnifiedDashboardCard } from '@/components/admin/UnifiedDashboardCard';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { broadcastProductUpdate } from '@/lib/queryClient';

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

// Popular equipment brands - same list as sell form
const EQUIPMENT_BRANDS = [
  'Rogue Fitness',
  'Concept2',
  'Bowflex',
  'York Barbell',
  'PowerBlock',
  'Rep Fitness',
  'Titan Fitness',
  'CAP Barbell',
  'Eleiko',
  'Life Fitness',
  'Hammer Strength',
  'Cybex',
  'Precor',
  'Body-Solid',
  'Nautilus',
  'StairMaster',
  'TRX',
  'Assault Fitness',
  'Sorinex',
  'EliteFTS',
  'Texas Power Bar',
  'American Barbell',
  'Ivanko',
  'Iron Grip',
  'HulkFit'
];

export function ProductForm() {
  const params = useParams();
  const id = params?.id as string | undefined;
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
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['/api/products', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/products/${id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch product');
      return res.json();
    },
    enabled: isEdit && !!id,
  });
  
  // Update form when product loads
  useEffect(() => {
    if (product && isEdit) {
      const productImages = Array.isArray(product.images) ? product.images : [];
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        categoryId: product.categoryId || '',
        stockQuantity: product.stockQuantity || 1,
        weight: product.weight || 0,
        condition: product.condition || 'like_new',
        brand: product.brand || '',
        images: productImages
      });
      setImagePreview(productImages);
    }
  }, [product, isEdit]);
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle Cloudinary image uploads with industry-standard limits
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const maxImages = 12; // Industry standard - matches eBay, Mercari, etc.
    if (imagePreview.length + files.length > maxImages) {
      toast({ 
        title: "Too many images", 
        description: `Maximum ${maxImages} images allowed per product. You currently have ${imagePreview.length} images.`
      });
      return;
    }
    
    setUploadingImage(true);
    setUploadProgress(0);
    
    try {
      const uploadPromises = files.map(async (file, index) => {
        // Check file size on frontend (12MB limit)
        if (file.size > 12 * 1024 * 1024) {
          throw new Error(`File "${file.name}" is too large. Maximum size is 12MB.`);
        }
        
        // Check file type on frontend
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File "${file.name}" has unsupported format. Only JPEG, PNG, and WebP are allowed.`);
        }
        
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        
        const response = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          body: formDataUpload,
          credentials: 'include'
        });
        
        if (!response.ok) {
          const error = await response.json();
          // Use specific server error message if available
          const errorMessage = error.message || error.error || 'Upload failed';
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        setUploadProgress(((index + 1) / files.length) * 100);
        return data.url;
      });
      
      const newImageUrls = await Promise.all(uploadPromises);
      const updatedImages = [...imagePreview, ...newImageUrls];
      
      setImagePreview(updatedImages);
      setFormData(prev => ({
        ...prev,
        images: updatedImages
      }));
      
      e.target.value = '';
      toast({ 
        title: "Success", 
        description: `${files.length} image(s) uploaded successfully! Total: ${updatedImages.length}/${maxImages} images.`
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Show specific error message from server or validation
      toast({ 
        title: "Upload Failed", 
        description: error.message || 'Failed to upload images. Please try again.',
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };
  
  // Remove image with proper state management
  const removeImage = (index: number) => {
    const newImages = imagePreview.filter((_, i) => i !== index);
    setImagePreview(newImages);
    // Don't update formData.images here as it's handled differently for submission
  };

  // Move image position
  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...imagePreview];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    
    setImagePreview(newImages);
    // Don't update formData.images here as it's handled differently for submission
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
    onSuccess: (data) => {
      toast({ title: "Success", description: isEdit ? 'Product updated successfully!' : 'Product created successfully!' });
      
      // Use global broadcast system for comprehensive real-time sync
      const productId = id || data?.id;
      const action = isEdit ? 'product_update' : 'product_create';
      broadcastProductUpdate(productId, action, { 
        name: formData.name,
        price: formData.price,
        images: imagePreview,
        stockQuantity: formData.stockQuantity
      });
      
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
    
    // Loading check for edit mode
    if (isEdit && productLoading) {
      toast({ title: "Loading", description: "Please wait while product data loads..." });
      return;
    }
    
    // Validate required fields
    if (!formData.name || !formData.brand || !formData.categoryId || formData.price <= 0) {
      toast({ title: "Validation Error", description: "Please fill in all required fields" });
      return;
    }
    
    // Create FormData for submission with current image state
    const data = new FormData();
    const currentImages = imagePreview;
    

    
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'images') {
        data.append(key, value.toString());
      }
    });
    
    // Always add images array, even if empty
    if (currentImages.length > 0) {
      currentImages.forEach(imageUrl => {
        data.append('images', imageUrl);
      });
    } else {
      // Explicitly add empty images array
      data.append('images', '');
    }
    
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
        <UnifiedDashboardCard 
          title="Basic Information"
          gradient="blue"
          className="space-y-4"
        >
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
                <UnifiedDropdown
                  label="Brand"
                  options={EQUIPMENT_BRANDS}
                  value={formData.brand}
                  placeholder="Search or select a brand..."
                  onChange={(brand) => setFormData({...formData, brand})}
                  searchable={true}
                  allowCustom={true}
                  required={true}
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
        </UnifiedDashboardCard>
        
        {/* Pricing & Inventory */}
        <UnifiedDashboardCard 
          title="Pricing & Inventory"
          gradient="green"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <PriceInput
                  id="price"
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
        </UnifiedDashboardCard>
        
        {/* Category & Condition */}
        <UnifiedDashboardCard 
          title="Category & Condition"
          gradient="purple"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories as any[]).map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <UnifiedDropdown
                  label="Condition"
                  options={[
                    { value: "new", label: "New" },
                    { value: "like_new", label: "Like New" },
                    { value: "good", label: "Good" },
                    { value: "fair", label: "Fair" },
                    { value: "needs_repair", label: "Needs Repair" }
                  ]}
                  value={formData.condition}
                  placeholder="Select condition"
                  onChange={(condition) => setFormData({...formData, condition})}
                  required={true}
                />
              </div>
            </div>
        </UnifiedDashboardCard>
        
        {/* Images */}
        <UnifiedDashboardCard 
          title="Product Images"
          gradient="orange"
          className="space-y-4"
        >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagePreview.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Product ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-600"
                  />
                  
                  {/* Primary badge */}
                  {index === 0 && (
                    <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </span>
                  )}
                  
                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeImage(index);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  
                  {/* Reorder buttons */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    {index > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => moveImage(index, index - 1)}
                        title="Move left"
                      >
                        ←
                      </Button>
                    )}
                    {index < imagePreview.length - 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-6 w-6 p-0 text-xs ml-auto"
                        onClick={() => moveImage(index, index + 1)}
                        title="Move right"
                      >
                        →
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Add Image Button */}
              {imagePreview.length < 12 && (
                <label className="border-2 border-dashed border-gray-600 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <span className="text-sm">{Math.round(uploadProgress)}%</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mb-2 text-gray-400" />
                      <span className="text-sm text-gray-400">Add Images</span>
                      <span className="text-xs text-gray-500 mt-1">Max 12 images</span>
                    </>
                  )}
                </label>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Maximum 12 images per product (industry standard)</p>
              <p>• Each image can be up to 12MB</p>
              <p>• Formats: JPEG, PNG, WebP</p>
              <p>• Recommended: Square images (1500x1500px) for best quality</p>
              <p>• First image will be the main product photo</p>
            </div>
        </UnifiedDashboardCard>
        
        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className={`px-6 py-3 rounded-lg transition-all duration-200 focus:outline-none flex items-center gap-2 ${
              submitMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              background: 'rgba(75, 85, 99, 0.4)',
              border: '1px solid rgba(156, 163, 175, 0.4)',
              color: 'white',
              fontWeight: '500'
            }}
          >
            {submitMutation.isPending ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-6 py-3 rounded-lg transition-all duration-200 focus:outline-none flex items-center gap-2"
            style={{
              background: 'transparent',
              border: '1px solid rgba(156, 163, 175, 0.4)',
              color: 'white',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}