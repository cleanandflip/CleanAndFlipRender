import { useState, Suspense, lazy } from "react";
import { Link } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/use-auth";
import { useLocality } from "@/hooks/useLocality";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryEligibilityBanner } from '@/components/fulfillment/DeliveryEligibilityBanner';

// Create a simple checkout button for now
const CheckoutButton = () => (
  <Link href="/checkout">
    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
      PROCEED TO CHECKOUT
    </Button>
  </Link>
);

// V2 Cart types - uses qty field consistently
type CartItem = {
  id: string;
  productId: string;
  qty: number; // V2 unified field
  product: {
    id: string;
    name: string;
    price: string;
    images: string[];
    brand?: string;
    stockQuantity?: number;
    is_local_delivery_available?: boolean;
    is_shipping_available?: boolean;
  };
};

export default function CartPageV2() {
  const { 
    data: cart, 
    isLoading, 
    isError, 
    updateCartItem,
    removeByProduct 
  } = useCart();
  const { data: locality } = useLocality();
  
  // V2 cart data structure with safe access
  const items = (cart as any)?.items || [];
  const hasItems = items.length > 0;
  const subtotal = (cart as any)?.subtotal || 0;
  const total = (cart as any)?.total || 0;

  const handleQuantityChange = async (productId: string, newQuantity: number, maxStock?: number) => {
    // Don't allow negative quantities
    if (newQuantity < 0) {
      return;
    }
    
    if (newQuantity === 0) {
      await removeByProduct(productId);
    } else {
      // Check stock limit if provided (no limit means unlimited stock)
      if (maxStock && maxStock > 0 && newQuantity > maxStock) {
        return; // Don't allow exceeding stock
      }
      // Use updateCartItem to set absolute quantity (not additive)
      await updateCartItem({ productId, qty: newQuantity });
    }
  };

  const handleRemove = (productId: string) => {
    removeByProduct(productId);
  };

  // Get first image URL with proper fallback
  const getImageUrl = (item: CartItem): string => {
    const images = item.product?.images;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return '/placeholder-product.jpg';
    }
    return images[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen pt-32 px-6 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <p className="text-red-600 mb-4">Failed to load cart</p>
            <Button onClick={() => {
              if (!import.meta.env.VITE_DISABLE_HARD_RELOADS) {
                window.location.reload();
              }
            }}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-4" />
            <h1 className="text-3xl font-bebas mb-4">YOUR CART IS EMPTY</h1>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any equipment to your cart yet.
            </p>
            <Link href="/products">
              <Button size="lg" className="gap-2">
                SHOP EQUIPMENT <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Delivery Eligibility Banner */}
        <div className="mb-6">
          <DeliveryEligibilityBanner />
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bebas">SHOPPING CART</h1>
          {locality?.eligible && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              Local Delivery Available
            </Badge>
          )}
        </div>

        {/* Enhanced local delivery banner */}
        {locality?.eligible && (
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-50/90 to-emerald-50/90 border border-green-300/60 rounded-2xl px-4 py-2 backdrop-blur-sm shadow-md">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Local</Badge>
              <span className="text-green-800 font-medium text-sm">
                FREE Local Delivery applies to eligible items
              </span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: CartItem) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image - Clickable */}
                    <Link href={`/products/${item.productId}`} className="w-24 h-24 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                      <img
                        src={getImageUrl(item)}
                        alt={item.product?.name || 'Product'}
                        className="w-full h-full object-cover rounded-md"
                        loading="lazy"
                      />
                    </Link>
                    
                    {/* Product Details */}
                    <div className="flex-1">
                      <Link href={`/products/${item.productId}`}>
                        <h3 className="font-semibold text-lg mb-1 cursor-pointer hover:text-blue-600 transition-colors">
                          {item.product?.name || 'Unknown Product'}
                        </h3>
                      </Link>
                      {item.product?.brand && (
                        <p className="text-gray-600 text-sm mb-2">{item.product.brand}</p>
                      )}
                      
                      {/* Stock indicator */}
                      {item.product?.stockQuantity && item.product.stockQuantity > 0 && (
                        <p className="text-xs text-gray-500 mb-2">
                          Stock: {item.product.stockQuantity} available
                          {item.qty >= item.product.stockQuantity && (
                            <span className="ml-2 text-amber-600 font-medium">Max quantity reached</span>
                          )}
                        </p>
                      )}
                      
                      {/* Fulfillment badges */}
                      <div className="flex items-center gap-2 mb-2">
                        {item.product?.is_local_delivery_available && item.product?.is_shipping_available && (
                          <Badge variant="outline" className="text-xs">Both</Badge>
                        )}
                        {item.product?.is_local_delivery_available && !item.product?.is_shipping_available && (
                          <Badge variant="outline" className="text-xs text-blue-700">Local Only</Badge>
                        )}
                        {!item.product?.is_local_delivery_available && item.product?.is_shipping_available && (
                          <Badge variant="outline" className="text-xs">Shipping Only</Badge>
                        )}
                      </div>
                      
                      <p className="text-2xl font-bebas">
                        ${parseFloat(item.product?.price || '0').toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.qty - 1, item.product?.stockQuantity)}
                          className="w-8 h-8 p-0"
                          data-testid={`button-decrease-qty-${item.productId}`}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.qty}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.qty + 1, item.product?.stockQuantity)}
                          className="w-8 h-8 p-0"
                          disabled={item.product?.stockQuantity && item.product.stockQuantity > 0 && item.qty >= item.product.stockQuantity}
                          data-testid={`button-increase-qty-${item.productId}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(item.productId)}
                        className="text-red-500 hover:text-red-700"
                        data-testid={`button-remove-${item.productId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Item Total */}
                  <div className="mt-4 text-right">
                    <p className="text-lg font-semibold">
                      ${(parseFloat(item.product?.price || '0') * item.qty).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="tracking-tight font-bebas text-2xl font-light py-2 px-0 my-1">ORDER SUMMARY</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>{locality?.eligible ? "FREE Local Delivery" : "Calculated at checkout"}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
                <div className="space-y-3 pt-4">
                  <CheckoutButton />
                  
                  <Link href="/products">
                    <Button variant="outline" className="w-full gap-2">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}