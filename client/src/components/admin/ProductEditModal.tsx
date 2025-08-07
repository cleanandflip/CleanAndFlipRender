import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  Save, 
  Loader2, 
  Package, 
  DollarSign, 
  Image as ImageIcon,
  Tag,
  AlertCircle,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Validation Schema
const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  sku: z.string().optional(),
  categoryId: z.string().min(1, 'Please select a category'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be positive'),
  stockQuantity: z.number().int().min(0, 'Stock must be non-negative'),
  brand: z.string().optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair']),
  status: z.enum(['active', 'sold', 'pending', 'draft']),
  featured: z.boolean(),
  weight: z.number().optional(),
  images: z.array(z.string()).min(1, 'At least one image is required')
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductEditModalProps {
  product?: any;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  open,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || []);
  const queryClient = useQueryClient();
  
  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json())
  });
  
  // Form setup
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      categoryId: product?.categoryId || '',
      description: product?.description || '',
      price: product?.price || 0,
      stockQuantity: product?.stockQuantity || 0,
      brand: product?.brand || '',
      condition: product?.condition || 'new',
      status: product?.status || 'active',
      featured: product?.featured ?? false,
      weight: product?.weight || undefined,
      images: product?.images || []
    }
  });
  
  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const url = product 
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products';
      
      const method = product ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(product ? 'Product updated!' : 'Product created!');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to save product');
      console.error('Save error:', error);
    }
  });
  
  // Image upload handler
  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const { urls } = await response.json();
      const newImages = [...imageUrls, ...urls];
      setImageUrls(newImages);
      form.setValue('images', newImages);
      
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload images');
      console.error('Upload error:', error);
    } finally {
      setUploadingImages(false);
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImages);
    form.setValue('images', newImages);
  };
  
  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!bg-gray-900 !border-gray-700 !text-white max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="!border-gray-700">
          <DialogTitle className="!text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            {product ? 'Edit Product' : 'Create New Product'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">
                  <Package className="w-4 h-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="pricing">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pricing & Stock
                </TabsTrigger>
                <TabsTrigger value="images">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Images
                </TabsTrigger>
              </TabsList>
              
              <div className="overflow-y-auto max-h-[calc(90vh-200px)] mt-6">
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter product name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Auto-generated if empty"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="min-h-[120px]"
                            placeholder="Describe your product..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Product brand"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="like_new">Like New</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                {/* Pricing Tab */}
                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                              <Input 
                                {...field}
                                type="number"
                                step="0.01"
                                className="pl-8"
                                placeholder="0.00"
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              placeholder="0"
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (lbs)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              placeholder="0"
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Featured Product</FormLabel>
                          <FormDescription>
                            Show on homepage and featured sections
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                {/* Images Tab */}
                <TabsContent value="images" className="space-y-4">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-8">
                      <input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        disabled={uploadingImages}
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        {uploadingImages ? (
                          <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
                        ) : (
                          <Upload className="w-12 h-12 text-gray-400" />
                        )}
                        <p className="mt-2 text-sm text-gray-600">
                          {uploadingImages ? 'Uploading...' : 'Click to upload images'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </label>
                    </div>
                    
                    {/* Image Preview Grid */}
                    {imageUrls.length > 0 && (
                      <div className="grid grid-cols-4 gap-4">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Product ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                            {index === 0 && (
                              <Badge className="absolute bottom-2 left-2 bg-blue-600">
                                Primary
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="images"
                      render={() => (
                        <FormItem>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            
            <DialogFooter className="border-t pt-4 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {product ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};