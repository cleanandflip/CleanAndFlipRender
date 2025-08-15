import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart, useUpdateCartItem, useRemoveFromCart, Cart, CartItem } from "@/hooks/use-cart";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import ImageWithFallback from "@/components/ImageWithFallback";
import { LocalBadge } from "@/components/locality/LocalBadge";
import { useLocality } from "@/hooks/useLocality";
import { Badge } from "@/components/ui/badge";
import { DeliveryEligibilityBanner } from '@/components/fulfillment/DeliveryEligibilityBanner';

export default function CartPage() {
  const { data: cart, isLoading, isError } = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveFromCart();
  const { data: locality } = useLocality();
  
  // Safe access to cart data with proper typing
  const cartData = cart as Cart;
  const items = cartData?.items || [];
  const hasItems = items.length > 0;
  const subtotal = cartData?.subtotal || 0;
  const total = cartData?.total || 0;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeMutation.mutate(productId);
    } else {
      updateMutation.mutate({ productId, quantity: newQuantity });
    }
  };

  const handleRemove = (productId: string) => {
    removeMutation.mutate(productId);
  };

  // FIXED: Get first image URL from product.images with proper fallback
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
        {/* Delivery Eligibility Banner for Cart */}
        <div className="mb-6">
          <DeliveryEligibilityBanner />
        </div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bebas">SHOPPING CART</h1>
          <LocalBadge isLocal={locality?.isLocal ?? false} />
        </div>

        {/* Enhanced Local delivery banner */}
        {locality?.isLocal && (
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-50/90 to-emerald-50/90 border border-green-300/60 rounded-2xl px-4 py-2 backdrop-blur-sm shadow-md">
              <LocalBadge isLocal={true} />
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
              <Card key={item.id} className="p-6">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <ImageWithFallback
                      src={getImageUrl(item)}
                      alt={item.product?.name || 'Product'}
                      className="w-24 h-24 object-cover rounded-lg"
                      fallback="/placeholder-product.jpg"
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">
                      {item.product?.name || 'Unknown Product'}
                    </h3>
                    {item.product?.brand && (
                      <p className="text-gray-600 text-sm mb-2">{item.product.brand}</p>
                    )}
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
                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                        disabled={updateMutation.isPending}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                        disabled={updateMutation.isPending}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.productId)}
                      disabled={removeMutation.isPending}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Item Total */}
                <div className="mt-4 text-right">
                  <p className="text-lg font-semibold">
                    ${(parseFloat(item.product?.price || '0') * item.quantity).toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="font-bebas text-xl">ORDER SUMMARY</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>{locality?.isLocal ? "FREE Local Delivery" : "Calculated at checkout"}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
                <div className="space-y-3 pt-4">
                  <Link href="/checkout">
                    <Button size="lg" className="w-full gap-2">
                      PROCEED TO CHECKOUT <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  
                  <Link href="/products">
                    <Button variant="outline" size="lg" className="w-full">
                      CONTINUE SHOPPING
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