import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/common/glass-card";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Heart, 
  Eye, 
  Star,
  Clock,
  Truck
} from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  compact?: boolean;
}

export default function ProductCard({ product, viewMode = 'grid', compact = false }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.stockQuantity || product.stockQuantity === 0) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    addToCart({
      productId: product.id,
      quantity: 1,
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
      description: isWishlisted 
        ? `${product.name} has been removed from your wishlist.`
        : `${product.name} has been added to your wishlist.`,
    });
  };

  const stockStatus = getStockStatus();
  const mainImage = product.images?.[0] || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";

  if (compact) {
    return (
      <Link href={`/products/${product.id}`}>
        <GlassCard className="overflow-hidden glass-hover cursor-pointer">
          <img 
            src={mainImage}
            alt={product.name}
            className="w-full h-32 object-cover"
          />
          <div className="p-3">
            <h4 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h4>
            <p className="text-accent-blue font-bold text-sm">${product.price}</p>
          </div>
        </GlassCard>
      </Link>
    );
  }

  if (viewMode === 'list') {
    return (
      <GlassCard className="p-6">
        <div className="flex gap-6">
          {/* Image */}
          <Link href={`/products/${product.id}`}>
            <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg cursor-pointer group">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-semibold text-lg hover:text-accent-blue transition-colors cursor-pointer line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                
                <div className="flex items-center gap-4 mt-2">
                  {product.brand && (
                    <Badge variant="outline" className="glass border-glass-border text-xs">
                      {product.brand}
                    </Badge>
                  )}
                  <Badge className={`${getConditionColor(product.condition)} text-white text-xs`}>
                    {product.condition.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stockStatus.dot}`}></div>
                    <span className={`text-xs ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                  </div>
                </div>

                {product.description && (
                  <p className="text-text-secondary text-sm mt-2 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-accent-blue mb-2">
                  ${product.price}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleWishlistToggle}
                    variant="outline"
                    size="sm"
                    className="glass border-glass-border"
                  >
                    <Heart 
                      size={16} 
                      className={isWishlisted ? "text-red-400 fill-current" : "text-gray-400"} 
                    />
                  </Button>
                  
                  <Button
                    onClick={handleAddToCart}
                    disabled={!product.stockQuantity || product.stockQuantity === 0}
                    className="bg-accent-blue hover:bg-blue-500"
                  >
                    <ShoppingCart size={16} className="mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-xs text-text-muted">
              <div className="flex items-center gap-1">
                <Eye size={12} />
                <span>{product.views || 0} views</span>
              </div>
              {product.weight && (
                <div className="flex items-center gap-1">
                  <span>{product.weight} lbs</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Listed {new Date(product.createdAt!).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Grid view (default)
  return (
    <GlassCard className="overflow-hidden glass-hover group">
      {/* Image Container */}
      <Link href={`/products/${product.id}`}>
        <div className="relative overflow-hidden cursor-pointer">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                onClick={handleWishlistToggle}
                variant="outline"
                size="sm"
                className="glass border-glass-border"
              >
                <Heart 
                  size={16} 
                  className={isWishlisted ? "text-red-400 fill-current" : "text-white"} 
                />
              </Button>
              
              <Button
                onClick={handleAddToCart}
                disabled={!product.stockQuantity || product.stockQuantity === 0}
                className="bg-accent-blue hover:bg-blue-500"
              >
                <ShoppingCart size={16} />
              </Button>
            </div>
          </div>

          {/* Featured Badge */}
          {product.featured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-warning text-black">
                <Star size={12} className="mr-1" />
                Featured
              </Badge>
            </div>
          )}

          {/* Stock Status */}
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 glass px-2 py-1 rounded">
              <div className={`w-1.5 h-1.5 rounded-full ${stockStatus.dot}`}></div>
              <span className={`text-xs ${stockStatus.color}`}>
                {stockStatus.text}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <Link href={`/products/${product.id}`}>
              <h3 className="font-semibold hover:text-accent-blue transition-colors cursor-pointer line-clamp-2">
                {product.name}
              </h3>
            </Link>
            
            {product.brand && (
              <p className="text-text-muted text-sm">{product.brand}</p>
            )}
          </div>
          
          <div className="text-right ml-2">
            <div className="text-xl font-bold text-accent-blue">
              ${product.price}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <Badge className={`${getConditionColor(product.condition)} text-white text-xs`}>
            {product.condition.replace('_', ' ').toUpperCase()}
          </Badge>
          {product.weight && (
            <Badge variant="outline" className="glass border-glass-border text-xs">
              {product.weight} lbs
            </Badge>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-text-secondary text-sm line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <Eye size={12} />
            <span>{product.views || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck size={12} />
            <span>Fast shipping</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
