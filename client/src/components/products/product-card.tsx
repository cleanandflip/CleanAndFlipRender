import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SmartLink } from "@/components/ui/smart-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WishlistButton, ProductPrice, StockIndicator, AddToCartButton } from "@/components/ui";
import { Card } from "@/components/ui/card";
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
import { routes } from "@/config/routes";

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  compact?: boolean;
  isWishlisted?: boolean;
}

export default function ProductCard({ product, viewMode = 'grid', compact = false, isWishlisted = false }: ProductCardProps) {
  // All logic now handled by unified components
  const mainImage = product.images?.[0];
  const hasImage = mainImage && mainImage.length > 0;

  if (compact) {
    return (
      <SmartLink href={routes.productDetail(product.id)} preserveState={true}>
        <Card className="overflow-hidden bg-card-hover cursor-pointer">
          {hasImage ? (
            <img 
              src={mainImage}
              alt={product.name}
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="w-full h-32 bg-bg-card-bg flex items-center justify-center">
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
        </Card>
      </SmartLink>
    );
  }

  if (viewMode === 'list') {
    return (
      <Card className="p-6">
        <div className="flex gap-6">
          {/* Image */}
          <SmartLink href={routes.productDetail(product.id)} preserveState={true}>
            <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg cursor-pointer group">
              {hasImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-bg-card-bg flex items-center justify-center">
                  <div className="text-center text-text-muted">
                    <div className="text-3xl mb-2">📦</div>
                    <div className="text-xs">No Image</div>
                  </div>
                </div>
              )}
            </div>
          </SmartLink>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <SmartLink href={routes.productDetail(product.id)} preserveState={true}>
                  <h3 className="font-semibold text-lg hover:text-accent-blue transition-colors cursor-pointer line-clamp-2">
                    {product.name}
                  </h3>
                </SmartLink>
                
                <div className="flex items-center gap-4 mt-2">
                  {product.brand && (
                    <Badge variant="outline" className="bg-card border-bg-card-border text-xs">
                      {product.brand}
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-card border-bg-card-border text-xs">
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
                    className="bg-card border-bg-card-border"
                    initialWishlisted={isWishlisted}
                  />
                  
                  <AddToCartButton
                    productId={product.id}
                    stock={product.stockQuantity}
                    size="sm"
                    className=""
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
      </Card>
    );
  }

  // Grid view (default) - Using consistent styling classes
  return (
    <div className="product-card group animate-fade-in">
      {/* Stock Badge */}
      {product.stockQuantity === 0 && (
        <span className="stock-badge out-of-stock">OUT OF STOCK</span>
      )}
      {product.stockQuantity === 1 && (
        <span className="stock-badge low-stock">Only 1 left</span>
      )}
      
      {/* Wishlist Button */}
      <div className="wishlist-button" onClick={(e) => e.stopPropagation()}>
        <WishlistButton 
          productId={product.id}
          size="small"
          className="w-full h-full bg-transparent hover:bg-transparent border-0"
          showTooltip={false}
          initialWishlisted={isWishlisted}
        />
      </div>
      
      {/* Image Section */}
      <SmartLink href={routes.productDetail(product.id)} preserveState={true}>
        <div className="product-image-wrapper cursor-pointer">
          {hasImage ? (
            <img 
              src={mainImage}
              alt={product.name}
              className="product-image"
            />
          ) : (
            <div className="product-image-placeholder">
              <div className="text-center text-text-muted">
                <div className="text-4xl mb-2">📦</div>
                <div className="text-xs">No Image</div>
              </div>
            </div>
          )}
        </div>
      </SmartLink>
      
      {/* Product Info Section */}
      <div className="product-info">
        <SmartLink href={routes.productDetail(product.id)} preserveState={true}>
          {/* Brand */}
          {product.brand && (
            <p className="product-brand">{product.brand}</p>
          )}
          
          {/* Title */}
          <h3 className="product-name cursor-pointer hover:text-blue-300 transition-colors">
            {product.name}
          </h3>
        </SmartLink>
        
        <div className="product-price-section">
          {/* Price */}
          <div className="flex items-baseline">
            <span className="product-price">${product.price}</span>
          </div>
          
          {/* Add to Cart Button */}
          <div onClick={(e) => e.stopPropagation()}>
            <AddToCartButton
              productId={product.id}
              stock={product.stockQuantity}
              size="sm"
              className={product.stockQuantity > 0 ? "btn-add-to-cart" : "btn-out-of-stock"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
