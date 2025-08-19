import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SmartLink } from "@/components/ui/smart-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
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
import { StockIndicator } from "@/components/ui/StockIndicator";
import { ProductPrice } from "@/components/ui/ProductPrice";
import AddToCartButton from "@/components/AddToCartButton";
import ProductAvailabilityChips from "@/components/locality/ProductAvailabilityChips";
import { FreeDeliveryPill } from "@/components/locality/FreeDeliveryPill";
import { useLocality } from "@/hooks/useLocality";

interface ProductCardProps {
  product: Product & {
    images: string[] | null;
    isLocalDeliveryAvailable?: boolean | null;
    isShippingAvailable?: boolean | null;
    is_local_delivery_available?: boolean | null; // legacy
    is_shipping_available?: boolean | null; // legacy
  };
  viewMode?: 'grid' | 'list';
  compact?: boolean;

}

export default function ProductCard({ product, viewMode = 'grid', compact = false }: ProductCardProps) {
  // Handle both string URLs and image objects with url property
  const imageData = product.images?.[0] as any;
  const mainImage = typeof imageData === 'string' ? imageData : imageData?.url;
  const hasImage = !!mainImage && mainImage.length > 0;
  const { data: locality } = useLocality();
  const isLocalEligible = Boolean((locality as any)?.eligible);
  const isLocalDelivery = (product.isLocalDeliveryAvailable ?? product.is_local_delivery_available) ?? false;
  const isShipping = (product.isShippingAvailable ?? product.is_shipping_available) ?? false;

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
            <ProductAvailabilityChips product={{ isLocalDeliveryAvailable: isLocalDelivery, isShippingAvailable: isShipping }} />
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
                
                <div className="space-y-2">
                  <ProductAvailabilityChips product={{ isLocalDeliveryAvailable: isLocalDelivery, isShippingAvailable: isShipping }} />
                  {isLocalEligible && isLocalDelivery && (
                    <FreeDeliveryPill />
                  )}
                  <AddToCartButton
                    productId={product.id}
                    product={{
                      is_local_delivery_available: (product.isLocalDeliveryAvailable ?? product.is_local_delivery_available) ?? undefined,
                      is_shipping_available: (product.isShippingAvailable ?? product.is_shipping_available) ?? undefined,
                      name: product.name,
                      price: String(product.price),
                      images: (Array.isArray(product.images) ? product.images : []) as any,
                      brand: product.brand ?? undefined,
                      stockQuantity: product.stockQuantity as any,
                    }}
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

  // Grid view (default)
  return (
    <div className="group relative bg-gray-800/30 rounded-lg overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-fade-in flex flex-col h-full">
      {/* Only show critical stock badge */}
      {product.stockQuantity === 1 && (
        <div className="absolute top-3 left-3 z-20 animate-bounce-subtle">
          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            Only 1 left
          </span>
        </div>
      )}
      
      {/* Clickable area for product details */}
      <SmartLink href={routes.productDetail(product.id)} preserveState={true} className="flex flex-col flex-1">
        <div className="cursor-pointer flex flex-col flex-1">
          {/* Clean Image - Fixed aspect ratio */}
          <div className="aspect-square relative bg-gray-900/30 group-hover:bg-gray-900/40 transition-colors overflow-hidden">
            {hasImage ? (
              <img 
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-900/50">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2 group-hover:animate-bounce-subtle">📦</div>
                  <div className="text-xs font-medium">No Image</div>
                </div>
              </div>
            )}
            
            {/* Subtle hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          
          {/* Product Info Section - Fixed height structure */}
          <div className="p-4 pb-2 flex-1 flex flex-col justify-between">
            <div>
              {/* Title - Fixed height with line clamp */}
              <h3 className="font-medium text-white mb-2 line-clamp-2 leading-tight min-h-[3rem] group-hover:text-slate-100 transition-colors duration-200">
                {product.name}
              </h3>
              
              {/* Brand - Fixed height whether present or not */}
              <div className="min-h-[1.5rem] mb-3">
                {product.brand && (
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                    {product.brand}
                  </p>
                )}
              </div>
            </div>
            
            {/* Price - Always at bottom of text section */}
            <p className="text-2xl font-bold text-white group-hover:text-slate-100 transition-colors">
              ${String(product.price)}
            </p>
          </div>
        </div>
      </SmartLink>
      
      {/* Availability chips and add to cart - Fixed height bottom section */}
      <div className="px-4 pb-4 space-y-2 mt-auto" onClick={(e) => e.stopPropagation()}>
        <ProductAvailabilityChips product={{ isLocalDeliveryAvailable: isLocalDelivery, isShippingAvailable: isShipping }} />
        {isLocalEligible && isLocalDelivery && (
          <div className="min-h-[1.5rem]">
            <FreeDeliveryPill />
          </div>
        )}
        <AddToCartButton
          productId={product.id}
          product={{
            is_local_delivery_available: (product.isLocalDeliveryAvailable ?? product.is_local_delivery_available) ?? undefined,
            is_shipping_available: (product.isShippingAvailable ?? product.is_shipping_available) ?? undefined,
            name: product.name,
            price: String(product.price),
            images: (Array.isArray(product.images) ? product.images : []) as any,
            brand: product.brand ?? undefined,
            stockQuantity: product.stockQuantity as any,
          }}
        />
      </div>
    </div>
  );
}
