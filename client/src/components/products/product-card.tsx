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

  // Grid view (default)
  return (
    <Link href={`/products/${product.id}`}>
      <div className="group relative bg-gray-800/30 rounded-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer">
        {/* Only show critical stock badge */}
        {product.stockQuantity === 1 && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              Only 1 left
            </span>
          </div>
        )}
        
        {/* Clean Image */}
        <div className="aspect-square relative bg-gray-900/30">
          {hasImage ? (
            <img 
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-4xl mb-2">📦</div>
            </div>
          )}
        </div>
        
        {/* Minimal Info Section */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-medium text-white mb-1 line-clamp-1">
            {product.name}
          </h3>
          
          {/* Brand */}
          {product.brand && (
            <p className="text-gray-500 text-sm mb-3">
              {product.brand}
            </p>
          )}
          
          {/* Price Only */}
          <p className="text-2xl font-bold text-white">
            ${product.price}
          </p>
        </div>
        
        {/* Hover Actions - Subtle */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform" onClick={(e) => e.stopPropagation()}>
            <AddToCartButton
              productId={product.id}
              stock={product.stockQuantity}
              size="sm"
              className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-100 pointer-events-auto"
            />
          </div>
        </div>
        
        {/* Subtle Wishlist - Icon Only */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <WishlistButton 
            productId={product.id}
            size="small"
            className="w-8 h-8 bg-white/10 backdrop-blur rounded-full pointer-events-auto"
            showTooltip={false}
          />
        </div>
      </div>
    </Link>
  );
}
