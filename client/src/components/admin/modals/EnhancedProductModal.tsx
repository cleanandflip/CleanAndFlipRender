// PERFECT PRODUCT MODAL WITH ALL FEATURES
import { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Loader2, Plus, Check, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useWebSocketState } from '@/hooks/useWebSocketState';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { ConfirmDialog } from '@/components/ConfirmDialog';

import { FulfillmentMode, modeFromProduct, booleansFromMode, FULFILLMENT, getFulfillmentDescription } from '@shared/fulfillment';

interface ProductModalProps {
  product?: any;
  onClose: () => void;
  onSave: () => void;
}

export function EnhancedProductModal({ product, onClose, onSave }: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { connected, socket, subscribe } = useWebSocketState();
  const queryClient = useQueryClient();

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories?active=true', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });
  
  // Lock body scroll while modal is open
  useScrollLock(true);
  
  // Add fulfillment mode state
  const initialModeSafe = (product ? modeFromProduct(product) : FULFILLMENT.LOCAL_AND_SHIPPING) as FulfillmentMode;
  const [mode, setMode] = useState<FulfillmentMode>(initialModeSafe);

  // Keep the form booleans and mode in sync when the user switches
  const changeMode = (m: FulfillmentMode) => {
    setMode(m);
    setFormData((f) => ({ ...f, ...booleansFromMode(m) }));
  };
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    compareAtPrice: '',
    cost: '',
    stock: '',
    sku: '',
    barcode: '',
    status: 'active',
    images: [] as string[],
    featured: false,
    condition: 'new',
    brand: '',
    weight: '',
    dimensions: '',
    tags: '',
    seoTitle: '',
    seoDescription: '',
    shippingRequired: true,
    taxable: true,
    trackQuantity: true,
    continueSellingWhenOutOfStock: false,
    requiresShipping: true,
    location: 'warehouse',
    // Delivery Options
    isLocalDeliveryAvailable: true,
    isShippingAvailable: true
  });

  // TRACK INITIAL DATA
  const [initialData, setInitialData] = useState<typeof formData | null>(null);

  useEffect(() => {
    if (product) {
      const initialMode = (modeFromProduct(product) || FULFILLMENT.LOCAL_AND_SHIPPING) as FulfillmentMode;
      const flags = booleansFromMode(initialMode);
      const data = {
        name: product.name || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        price: product.price?.toString() || '',
        compareAtPrice: product.compareAtPrice?.toString() || '',
        cost: product.cost?.toString() || '',
        stock: product.stockQuantity?.toString() || product.stock?.toString() || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        status: product.status || 'active',
        images: product.images || [],
        featured: (product.isFeatured ?? product.is_featured ?? product.featured) || false,
        condition: product.condition || 'new',
        brand: product.brand || '',
        weight: product.weight?.toString() || '',
        dimensions: product.dimensions || '',
        tags: product.tags?.join?.(', ') || '',
        seoTitle: product.seoTitle || '',
        seoDescription: product.seoDescription || '',
        shippingRequired: product.shippingRequired !== false,
        taxable: product.taxable !== false,
        trackQuantity: product.trackQuantity !== false,
        continueSellingWhenOutOfStock: product.continueSellingWhenOutOfStock || false,
        requiresShipping: product.requiresShipping !== false,
        location: product.location || 'warehouse',
        // Delivery Options (derive from mode; handles snake/camel automatically)
        isLocalDeliveryAvailable: flags.isLocalDeliveryAvailable,
        isShippingAvailable: flags.isShippingAvailable,
      };
      setFormData(data);
      setInitialData(data);
      setMode(initialMode);
    } else {
      setInitialData(formData);
    }
  }, [product]);

  // Unsaved changes protection
  const unsavedChanges = useUnsavedChanges({
    hasChanges: initialData ? JSON.stringify(formData) !== JSON.stringify(initialData) : false,
    message: 'You have unsaved product changes. Would you like to save them before closing?'
  });

  // CLICK OUTSIDE HANDLER
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        // Don't close if confirm dialog is showing
        if (!unsavedChanges.showDialog) {
          handleClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [unsavedChanges.showDialog]);

  // HANDLE CLOSE WITH SAVE PROMPT
  const handleClose = () => {
    if (!unsavedChanges.confirmNavigation(() => onClose())) {
      // Navigation was prevented, dialog is showing
    }
  };

  // IMAGE UPLOAD WITH PROGRESS AND VALIDATION
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Pre-upload validation
    const fileArray = Array.from(files);
    const maxSize = 5; // MB
    const oversizedFiles = fileArray.filter(file => file.size > maxSize * 1024 * 1024);
    
    if (oversizedFiles.length > 0) {
      const sizeInfo = oversizedFiles.map(f => `${f.name} (${(f.size / (1024 * 1024)).toFixed(1)}MB)`);
      toast({
        title: "Files too large",
        description: `These files exceed ${maxSize}MB limit: ${sizeInfo.slice(0, 2).join(', ')}${sizeInfo.length > 2 ? '...' : ''}`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    fileArray.forEach(file => {
      formDataUpload.append('images', file);
    });
    formDataUpload.append('folder', 'products');

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
      const urls = result.success ? result.urls : [];
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls]
      }));
      
      toast({
        title: "Images Uploaded",
        description: `${urls.length} image(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // REMOVE IMAGE
  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // SUBMIT WITH LOADING
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (name, price, category)",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const fulfillment = booleansFromMode(mode);

      const method = product ? "PUT" : "POST";
      const stockNum = parseInt(String(formData.stock)) || 0;

      const submitData = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,       // camel
        category_id: formData.categoryId,      // snake (compat)
        brand: formData.brand,
        price: parseFloat(String(formData.price)) || 0,
        compareAtPrice: formData.compareAtPrice ? parseFloat(String(formData.compareAtPrice)) : null,
        cost: formData.cost ? parseFloat(String(formData.cost)) : null,
        stockQuantity: stockNum,
        continueSellingWhenOutOfStock: !!formData.continueSellingWhenOutOfStock,
        continue_selling_when_out_of_stock: !!formData.continueSellingWhenOutOfStock,
        status: formData.status,
        weight: formData.weight ? parseFloat(String(formData.weight)) : 0,
        sku: formData.sku || null,
        images: formData.images,

        // Send canonical mode string as well for backend alignment
        fulfillmentMode: mode,
        fulfillment_mode: mode,

        // booleans (server expects snake_case — send both for safety)
        is_featured: !!formData.featured,
        isFeatured: !!formData.featured,
        featured: !!formData.featured,

        // Use the currently selected mode (authoritative)
        is_local_delivery_available: !!fulfillment.isLocalDeliveryAvailable,
        isLocalDeliveryAvailable:    !!fulfillment.isLocalDeliveryAvailable,
        is_shipping_available:       !!fulfillment.isShippingAvailable,
        isShippingAvailable:         !!fulfillment.isShippingAvailable,
      };

      const url = product ? `/api/admin/products/${product.id}` : `/api/admin/products`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
        credentials: 'include'
      });

      if (!res.ok) {
        const error = await res.json();
        toast({ title: "Save failed", description: error.message || "Could not update product.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Force immediate invalidation with precise query keys
      console.log('🔥 FORCING CACHE INVALIDATION - FEATURED PRODUCTS');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] }),
        queryClient.invalidateQueries({ queryKey: ['adminProducts'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] }),
        product?.id ? queryClient.invalidateQueries({ queryKey: ['product', product.id] }) : Promise.resolve(),
      ]);
      
      // Also trigger a manual refetch
      queryClient.refetchQueries({ queryKey: ['/api/products/featured'] });

      toast({ title: "Product updated", description: "Fulfillment settings saved." });
      setLoading(false);
      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || 'Failed to save product',
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        ref={modalRef}
        className="bg-[#1e293b] border border-gray-700 rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-[#1e293b] to-[#2d3748]">
          <div>
            <h2 className="text-xl font-bold text-white">
              {product ? 'Edit Product' : 'Create New Product'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {product ? `Editing: ${product.name}` : 'Add a new product to your catalog'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(initialData && JSON.stringify(formData) !== JSON.stringify(initialData)) && (
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-[#0f172a]/50">
          <div className="p-6 space-y-8">
            
            {/* Images Section */}
            <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                Product Images
              </h3>
              
              <div className="grid grid-cols-5 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group animate-fadeIn">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-700 group-hover:border-blue-500 transition-all duration-200"
                    />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        Main
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <label className="relative cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="w-full h-32 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-500/10 transition-all duration-200 group-hover:scale-105">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-400 mb-2" />
                        <span className="text-xs text-gray-400 group-hover:text-blue-400">Add Images</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Product Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
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
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g. PowerBlock, Rogue"
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
                    placeholder="Describe your product..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Pricing & Inventory</h3>
              
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Price <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Stock Quantity <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="needs_repair">Needs Repair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="SKU-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Weight (lbs)
                  </label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Inventory Options */}
              <div className="mt-6 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 bg-transparent text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                    Featured Product
                  </span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.continueSellingWhenOutOfStock}
                    onChange={(e) => setFormData({ ...formData, continueSellingWhenOutOfStock: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 bg-transparent text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                    Continue selling when out of stock
                  </span>
                </label>
              </div>
            </div>

            {/* Delivery & Fulfillment Options */}
            <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Delivery & Fulfillment Options</h3>
              <p className="text-sm text-gray-400 mb-6">Choose how customers can receive this product.</p>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-400">Fulfillment</label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => changeMode(FULFILLMENT.LOCAL_ONLY)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      mode === FULFILLMENT.LOCAL_ONLY
                        ? "border-green-400 bg-green-500/10 text-green-200" 
                        : "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Local delivery only</h4>
                        <p className="text-xs mt-1 opacity-75">Heavy/bulky items. Only purchasable by local customers.</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        mode === FULFILLMENT.LOCAL_ONLY 
                          ? "border-green-400 bg-green-400" 
                          : "border-gray-500"
                      }`} />
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => changeMode(FULFILLMENT.LOCAL_AND_SHIPPING)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      mode === FULFILLMENT.LOCAL_AND_SHIPPING
                        ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" 
                        : "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Local delivery & Shipping</h4>
                        <p className="text-xs mt-1 opacity-75">Available for both local delivery and nationwide shipping.</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        mode === FULFILLMENT.LOCAL_AND_SHIPPING
                          ? "border-emerald-400 bg-emerald-400" 
                          : "border-gray-500"
                      }`} />
                    </div>
                  </button>
                </div>
                

              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-700 bg-[#1e293b]/80 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {(initialData && JSON.stringify(formData) !== JSON.stringify(initialData)) && (
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
                disabled={loading || (!formData.name || !formData.price || !formData.categoryId)}
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
                    {product ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Unsaved Changes Dialog */}
      <ConfirmDialog
        isOpen={unsavedChanges.showDialog}
        title="Unsaved Product Changes"
        message="You have unsaved product changes. Would you like to save them before closing?"
        onSave={() => unsavedChanges.handleSave(() => {
          handleSubmit();
        })}
        onDiscard={unsavedChanges.handleDiscard}
        onCancel={unsavedChanges.handleCancel}
        showSave={true}
      />
    </div>
  );
}