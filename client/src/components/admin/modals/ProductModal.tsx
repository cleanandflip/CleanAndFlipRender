// COMPLETE PRODUCT MODAL WITH IMAGE UPLOAD/DELETE
import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Plus, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductModalProps {
  product?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function ProductModal({ product, isOpen, onClose, onSave }: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    status: 'active',
    images: [] as string[],
    featured: false,
    condition: 'new',
    brand: '',
    weight: '',
    dimensions: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        status: product.status || 'active',
        images: product.images || [],
        featured: product.featured || false,
        condition: product.condition || 'new',
        brand: product.brand || '',
        weight: product.weight || '',
        dimensions: product.dimensions || ''
      });
    }
  }, [product]);

  // UPLOAD IMAGE TO CLOUDINARY
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        const res = await fetch('/api/admin/products/upload', {
          method: 'POST',
          body: formDataUpload,
          credentials: 'include'
        });

        const data = await res.json();
        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      
      toast({
        title: "Upload Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // DELETE IMAGE
  const handleDeleteImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    toast({
      title: "Image Removed",
      description: "Image removed from product",
    });
  };

  // REORDER IMAGES
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...formData.images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newImages.length) return;
    
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // SAVE PRODUCT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = product 
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products';
      
      const method = product ? 'PUT' : 'POST';
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        }),
        credentials: 'include'
      });

      if (res.ok) {
        toast({
          title: product ? "Product Updated" : "Product Added",
          description: product ? 'Product updated successfully' : 'Product added successfully',
        });
        onSave();
        onClose();
      } else {
        throw new Error('Failed to save product');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] border border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-4">
                Product Images
              </label>
              
              {/* Image Preview Grid */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-700"
                    />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                        Main
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'down')}
                        disabled={index === formData.images.length - 1}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(index)}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Upload Button */}
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="w-full h-32 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center hover:border-gray-600 hover:bg-white/5 transition-colors">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-400">Upload Images</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f172a]/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f172a]/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Strength Training">Strength Training</option>
                  <option value="Cardio Equipment">Cardio Equipment</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f172a]/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f172a]/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Stock *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f172a]/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f172a]/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f172a]/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-[#0f172a]/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Enter product description..."
              />
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Weight (lbs)
                </label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f172a]/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Dimensions
                </label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f172a]/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="L x W x H"
                />
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-700 bg-transparent"
              />
              <label htmlFor="featured" className="text-sm text-gray-400">
                Feature this product on homepage
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}