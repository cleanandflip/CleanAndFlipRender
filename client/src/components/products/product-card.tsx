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
  Truck,
  Package
} from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  compact?: boolean;
}

export default function ProductCard({ product, viewMode = 'grid', compact = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [cartClicked, setCartClicked] = useState(false);
  const [heartClicked, setHeartClicked] = useState(false);
  
  // All logic now handled by unified components
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
                  <Badge variant="outline" className="glass border-glass-border text-xs">
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

  // Grid view (default) - Premium animated version
  return (
    <div 
      className={`group relative bg-gray-800/30 rounded-lg overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl cursor-pointer ${
        isClicked ? 'animate-bounce-subtle' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // Only navigate if not clicking on buttons
        if (!(e.target as HTMLElement).closest('button')) {
          setIsClicked(true);
          setTimeout(() => setIsClicked(false), 600);
          // Navigate to product page
          window.location.href = `/products/${product.id}`;
        }
      }}
    >
      {/* Only show critical stock badge with pulse animation */}
      {product.stockQuantity === 1 && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
            Only 1 left
          </span>
        </div>
      )}
      
      {/* Clean Image with zoom effect */}
      <div className="aspect-square relative bg-gray-900/30 overflow-hidden">
        {hasImage ? (
          <img 
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="w-16 h-16 text-gray-700 transition-transform duration-300 group-hover:scale-110" />
          </div>
        )}
      </div>
      
      {/* Minimal Info Section */}
      <div className="p-4">
        <h3 className="font-medium text-white mb-1 line-clamp-1 transition-colors group-hover:text-blue-400">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-gray-500 text-sm mb-3">{product.brand}</p>
        )}
        <p className="text-2xl font-bold text-white">${product.price}</p>
      </div>
      
      {/* CONVENIENT BOTTOM BAR - Add to Cart & Wishlist */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur transform transition-all duration-300 ${
        isHovered ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex items-center gap-2 p-3">
          <div 
            className={`flex-1 ${cartClicked ? 'animate-bounce-subtle' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCartClicked(true);
              setTimeout(() => setCartClicked(false), 600);
            }}
          >
            <AddToCartButton
              productId={product.id}
              stock={product.stockQuantity}
              size="sm"
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium 
                       transition-all duration-200 hover:bg-blue-700 hover:shadow-lg 
                       active:scale-95 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </AddToCartButton>
          </div>
          
          <div 
            className={`${heartClicked ? 'animate-bounce-subtle' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHeartClicked(true);
              setTimeout(() => setHeartClicked(false), 600);
            }}
          >
            <WishlistButton 
              productId={product.id}
              size="small"
              className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center 
                       transition-all duration-200 hover:shadow-lg active:scale-95"
              showTooltip={false}
            >
              <Heart className={`w-5 h-5 text-white transition-all ${
                heartClicked ? 'animate-ping-once' : ''
              }`} />
            </WishlistButton>
          </div>
        </div>
      </div>
      
      {/* Click ripple effect */}
      {isClicked && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 rounded-lg animate-ripple bg-white/20" />
        </div>
      )}
    </div>
  );
}
