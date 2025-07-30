import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WishlistButton, ProductPrice, StockIndicator, AddToCartButton } from "@/components/ui";
import GlassCard from "@/components/common/glass-card";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
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
  const [isHovered, setIsHovered] = useState(false);
  
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

  const mainImage = product.images?.[0];
  const hasImage = mainImage && mainImage.length > 0;

  if (compact) {
    return (
      <Link href={`/products/${product.id}`}>
        <GlassCard className="overflow-hidden glass-hover cursor-pointer">
          {hasImage ? (
            <img 
              src={mainImage}
              alt={product.name}
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="w-full h-32 bg-glass-bg flex items-center justify-center">
              <div className="text-center text-text-muted">
                <div className="text-2xl mb-2">📦</div>
                <div className="text-xs">No Image</div>
              </div>
            </div>
          )}
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
              {hasImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-glass-bg flex items-center justify-center">
                  <div className="text-center text-text-muted">
                    <div className="text-3xl mb-2">📦</div>
                    <div className="text-xs">No Image</div>
                  </div>
                </div>
              )}
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
                  <StockIndicator 
                    stock={product.stockQuantity}
                    size="small"
                  />
                </div>

                {product.description && (
                  <p className="text-text-secondary text-sm mt-2 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="text-right ml-4">
                <ProductPrice 
                  price={product.price}
                  size="large"
                  className="mb-2"
                />
                
                <div className="flex items-center gap-2">
                  <WishlistButton 
                    productId={product.id}
                    size="small"
                    className="glass border-glass-border"
                  />
                  
                  <AddToCartButton
                    productId={product.id}
                    stock={product.stockQuantity}
                    size="sm"
                    className="bg-accent-blue hover:bg-blue-500"
                  />
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

  // Grid view - Clean, spacious design
  return (
    <div 
      className="group relative bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Single Badge Area - Top Left */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {product.featured && (
          <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-medium shadow-lg">
            <Star size={12} className="inline mr-1" />
            Featured
          </span>
        )}
        {product.stockQuantity === 1 && (
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
            Only 1 left!
          </span>
        )}
      </div>
      
      {/* Clean Wishlist Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <WishlistButton 
          productId={product.id} 
          size="small"
          showTooltip={false}
        />
      </div>
      
      <Link href={`/products/${product.id}`} className="block">
        {/* Image Container - More Space */}
        <div className="aspect-[4/3] relative overflow-hidden bg-gray-800">
          {hasImage ? (
            <img 
              src={mainImage} 
              alt={product.name}
              className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="text-6xl mb-4 opacity-40">📦</div>
              <p className="text-gray-500 text-sm font-medium">No Image Available</p>
              <p className="text-gray-600 text-xs mt-1">Product photo coming soon</p>
            </div>
          )}
          
          {/* Hover Overlay - Clean Add to Cart */}
          <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <AddToCartButton 
              productId={product.id}
              stock={product.stockQuantity}
              size="sm"
              className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            />
          </div>
        </div>
        
        {/* Product Info - Spacious */}
        <div className="p-6 space-y-4">
          {/* Title & Brand */}
          <div>
            <h3 className="font-semibold text-white text-lg leading-tight mb-1 group-hover:text-blue-400 transition-colors">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-gray-400 text-sm">{product.brand}</p>
            )}
          </div>
          
          {/* Price & Condition Row */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-400">
              ${product.price}
            </span>
            {product.condition && (
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                {product.condition.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Single Key Spec */}
          {product.weight && (
            <p className="text-gray-500 text-sm">
              <span className="text-gray-400">Weight:</span> {product.weight} lbs
            </p>
          )}
          
          {/* Description */}
          {product.description && (
            <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
