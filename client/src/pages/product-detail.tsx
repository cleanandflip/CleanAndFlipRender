import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import GlassCard from "@/components/common/glass-card";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Eye, 
  Truck, 
  Shield, 
  RotateCcw,
  Star,
  ChevronLeft,
  ChevronRight,
  ZoomIn
} from "lucide-react";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Safety check to ensure id is a valid string
  if (!id || typeof id !== 'string') {
    console.error('Invalid product ID:', id, typeof id);
  }
  
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id && typeof id === 'string' && id !== '[object Object]',
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 2 * 60 * 1000, // 2 minutes stale time for individual products
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/wishlist", {
        productId: id,
        userId: "temp-user-id", // Replace with actual user ID
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Wishlist",
        description: "Product has been added to your wishlist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add to wishlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-glass-bg rounded-xl h-96"></div>
              <div className="space-y-4">
                <div className="h-8 bg-glass-bg rounded"></div>
                <div className="h-6 bg-glass-bg rounded w-3/4"></div>
                <div className="h-6 bg-glass-bg rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-6xl mx-auto">
          <GlassCard className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Product Not Found</h1>
            <p className="text-text-secondary mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/products">
              <Button className="bg-accent-blue hover:bg-blue-500">
                Browse Products
              </Button>
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const currentImage = images[currentImageIndex] || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      quantity,
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || "",
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Product link has been copied to clipboard.",
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Product link has been copied to clipboard.",
      });
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-500';
      case 'like_new': return 'bg-blue-500';
      case 'good': return 'bg-yellow-500';
      case 'fair': return 'bg-orange-500';
      case 'needs_repair': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStockStatus = () => {
    if (!product.stockQuantity || product.stockQuantity === 0) {
      return { text: "Out of Stock", color: "text-gray-400", dot: "bg-gray-400" };
    } else if (product.stockQuantity <= 3) {
      return { text: `${product.stockQuantity} left`, color: "text-orange-400", dot: "bg-orange-400" };
    } else {
      return { text: "In Stock", color: "text-green-400", dot: "bg-green-400" };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-text-secondary">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/products">Products</Link>
            <span>/</span>
            <span className="text-white">{product.name}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <GlassCard className="overflow-hidden">
              <div className="relative group cursor-pointer" onClick={() => setShowLightbox(true)}>
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={32} />
                </div>
                
                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 glass p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 glass p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
            </GlassCard>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {images.slice(0, 6).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`glass overflow-hidden transition-all duration-200 ${
                      index === currentImageIndex ? 'ring-2 ring-accent-blue' : 'hover:opacity-80'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="font-bebas text-4xl mb-2">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-accent-blue">${product.price}</span>
                {product.brand && (
                  <Badge variant="outline" className="glass border-glass-border">
                    {product.brand}
                  </Badge>
                )}
              </div>
              
              {/* Stock Status and Condition */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stockStatus.dot}`}></div>
                  <span className={`text-sm font-medium ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>
                <Badge className={`${getConditionColor(product.condition)} text-white`}>
                  {product.condition.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Views */}
              <div className="flex items-center gap-2 mt-2 text-sm text-text-muted">
                <Eye size={16} />
                <span>{product.views || 0} views</span>
              </div>
            </div>

            <Separator className="bg-glass-border" />

            {/* Quick Description */}
            {product.description && (
              <div>
                <p className="text-text-secondary leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Specifications Preview */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Key Specifications</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(product.specifications).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="glass p-3 rounded-lg">
                      <div className="text-sm text-text-muted">{key}</div>
                      <div className="font-medium">{value as string}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-glass-border" />

            {/* Add to Cart Section */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center glass rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-white/10 transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-white/10 transition-colors"
                    disabled={!product.stockQuantity || quantity >= product.stockQuantity}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.stockQuantity || product.stockQuantity === 0}
                  className="flex-1 bg-accent-blue hover:bg-blue-500 text-white"
                >
                  <ShoppingCart size={20} className="mr-2" />
                  Add to Cart
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => addToWishlistMutation.mutate()}
                  disabled={addToWishlistMutation.isPending}
                  className="glass border-glass-border"
                >
                  <Heart size={20} />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="glass border-glass-border"
                >
                  <Share2 size={20} />
                </Button>
              </div>
            </div>

            {/* Features */}
            <GlassCard className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Truck className="mx-auto mb-2 text-accent-blue" size={24} />
                  <div className="text-sm font-medium">Fast Shipping</div>
                  <div className="text-xs text-text-muted">2-3 business days</div>
                </div>
                <div>
                  <Shield className="mx-auto mb-2 text-green-400" size={24} />
                  <div className="text-sm font-medium">Inspected</div>
                  <div className="text-xs text-text-muted">Quality guaranteed</div>
                </div>
                <div>
                  <RotateCcw className="mx-auto mb-2 text-orange-400" size={24} />
                  <div className="text-sm font-medium">30-Day Returns</div>
                  <div className="text-xs text-text-muted">Easy returns</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="glass w-full justify-start">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="shipping">Shipping Info</TabsTrigger>
              <TabsTrigger value="returns">Return Policy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold mb-4">Product Description</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-text-secondary leading-relaxed">
                    {product.description || "No detailed description available for this product."}
                  </p>
                </div>
              </GlassCard>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-6">
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold mb-4">Specifications</h3>
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-3 glass rounded-lg">
                        <span className="font-medium">{key}:</span>
                        <span className="text-text-secondary">{value as string}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary">No specifications available for this product.</p>
                )}
              </GlassCard>
            </TabsContent>
            
            <TabsContent value="shipping" className="mt-6">
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold mb-4">Shipping Information</h3>
                <div className="space-y-4 text-text-secondary">
                  <div>
                    <h4 className="font-medium text-white mb-2">Delivery Options</h4>
                    <ul className="space-y-1">
                      <li>• Standard Shipping: 3-5 business days</li>
                      <li>• Expedited Shipping: 1-2 business days</li>
                      <li>• Local Pickup: Available in Asheville, NC</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">Shipping Costs</h4>
                    <p>Shipping costs are calculated at checkout based on weight and destination.</p>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>
            
            <TabsContent value="returns" className="mt-6">
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold mb-4">Return Policy</h3>
                <div className="space-y-4 text-text-secondary">
                  <div>
                    <h4 className="font-medium text-white mb-2">30-Day Return Window</h4>
                    <p>You have 30 days from delivery to return items in original condition.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">Return Process</h4>
                    <ol className="space-y-1">
                      <li>1. Contact our support team</li>
                      <li>2. Receive return authorization</li>
                      <li>3. Pack items securely</li>
                      <li>4. Ship with provided label</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">Refund Timeline</h4>
                    <p>Refunds are processed within 5-7 business days after we receive your return.</p>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl"
            >
              ✕
            </button>
            <img
              src={currentImage}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
