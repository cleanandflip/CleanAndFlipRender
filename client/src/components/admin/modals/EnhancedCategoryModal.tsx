// ENHANCED CATEGORY MODAL WITH ANIMATIONS
import { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Loader2, Plus, Check, AlertCircle, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useScrollLock } from '@/hooks/useScrollLock';

interface CategoryModalProps {
  category?: any;
  onClose: () => void;
  onSave: () => void;
}

export function EnhancedCategoryModal({ category, onClose, onSave }: CategoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useWebSocket();
  
  // Lock body scroll while modal is open
  useScrollLock(true);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    displayOrder: '0',
    isActive: true,
    productCount: '0',
    filterConfig: '{}'
  });

  const [initialData, setInitialData] = useState<typeof formData | null>(null);

  useEffect(() => {
    if (category) {
      const data = {
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        displayOrder: category.displayOrder?.toString() || '0',
        isActive: category.isActive !== false,
        productCount: category.productCount?.toString() || '0',
        filterConfig: category.filterConfig ? JSON.stringify(category.filterConfig, null, 2) : '{}'
      };
      setFormData(data);
      setInitialData(data);
    } else {
      // Auto-generate slug from name for new categories
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newData = { ...formData, slug };
      setInitialData(newData);
    }
  }, [category]);

  useEffect(() => {
    if (initialData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
      setHasChanges(changed);
    }
  }, [formData, initialData]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hasChanges]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (!category && formData.name) {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (slug !== formData.slug) {
        setFormData(prev => ({ ...prev, slug }));
      }
    }
  }, [formData.name, category]);

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Do you want to save them?')) {
        handleSubmit();
      } else if (confirm('Are you sure you want to discard your changes?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Pre-upload validation
    const maxSize = 5; // MB
    if (file.size > maxSize * 1024 * 1024) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      toast({
        title: "File too large",
        description: `${file.name} (${sizeInMB}MB) exceeds ${maxSize}MB limit. Please compress the image.`,
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select a valid image file (JPEG, PNG, or WebP).",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('images', file);
    formDataUpload.append('folder', 'categories');

    try {
      const res = await fetch('/api/upload/images', {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorResult = await res.json();
        throw new Error(errorResult.message || 'Upload failed');
      }
      
      const result = await res.json();
      if (result.success && result.urls && result.urls[0]) {
        setFormData(prev => ({ ...prev, imageUrl: result.urls[0] }));
        toast({
          title: "Image Uploaded",
          description: "Category image uploaded successfully",
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.slug) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (name, slug)",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const endpoint = category 
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories';
      
      const method = category ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        displayOrder: parseInt(formData.displayOrder) || 0,
        productCount: parseInt(formData.productCount) || 0,
        filterConfig: formData.filterConfig ? JSON.parse(formData.filterConfig) : {}
      };
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
        credentials: 'include'
      });

      if (res.ok) {
        toast({
          title: "Success!",
          description: category ? 'Category updated successfully' : 'Category created successfully',
        });
        
        // Broadcast update for live sync
        sendMessage({
          type: 'category_update',
          data: { 
            categoryId: category?.id,
            action: category ? 'update' : 'create',
            name: formData.name,
            slug: formData.slug
          }
        });
        
        onSave();
        onClose();
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save category');
      }
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || 'Failed to save category',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div 
        ref={modalRef}
        className="bg-[#1e293b] border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-[#1e293b] to-[#2d3748]">
          <div>
            <h2 className="text-xl font-bold text-white">
              {category ? 'Edit Category' : 'Create New Category'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {category ? `Editing: ${category.name}` : 'Add a new product category'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-400">Unsaved changes</span>
              </div>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-[#0f172a]/50">
          <div className="p-6 space-y-8">
            
            {/* Category Image */}
            <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                Category Image
              </h3>
              
              <div className="flex items-center gap-6">
                {formData.imageUrl && (
                  <div className="relative group">
                    <img
                      src={formData.imageUrl}
                      alt="Category"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
                
                <label className="cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="w-32 h-32 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-500/10 transition-all duration-200">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-400 mb-2" />
                        <span className="text-xs text-gray-400 group-hover:text-blue-400">Upload Image</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-400" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Category Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    URL Slug <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="category-url-slug"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Describe this category..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-700 bg-transparent text-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                      Active Category
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-700 bg-[#1e293b]/80 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {hasChanges && (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span>You have unsaved changes</span>
                </>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-gray-700 rounded-lg transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!formData.name || !formData.slug)}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 btn-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {category ? 'Update Category' : 'Create Category'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}