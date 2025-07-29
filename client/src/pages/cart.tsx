import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import GlassCard from "@/components/common/glass-card";
import { useCart } from "@/hooks/use-cart";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, cartCount, isLoading } = useCart();

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-glass-bg rounded w-48 mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-glass-bg rounded-xl"></div>
                ))}
              </div>
              <div className="h-64 bg-glass-bg rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-bebas text-4xl md:text-6xl mb-8">YOUR CART</h1>
          
          <GlassCard className="p-12 text-center">
            <ShoppingBag className="mx-auto mb-6 text-gray-400" size={64} />
            <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-text-secondary mb-8">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link href="/products">
              <Button className="bg-accent-blue hover:bg-blue-500 text-white">
                Start Shopping
              </Button>
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  const subtotal = cartTotal;
  const shipping = subtotal > 100 ? 0 : 25; // Free shipping over $100
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-bebas text-4xl md:text-6xl">YOUR CART</h1>
          <div className="text-text-secondary">
            {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <GlassCard className="divide-y divide-glass-border">
              {cartItems.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.product.images?.[0] || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                        alt={item.product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Link href={`/products/${item.product.id}`}>
                            <h3 className="font-semibold text-lg hover:text-accent-blue transition-colors cursor-pointer">
                              {item.product.name}
                            </h3>
                          </Link>
                          {item.product.brand && (
                            <p className="text-text-muted text-sm">{item.product.brand}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center glass rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            className="p-2 hover:bg-white/10 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-4 py-2 min-w-[3rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-white/10 transition-colors"
                            disabled={!item.product.stockQuantity || item.quantity >= item.product.stockQuantity}
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            ${(Number(item.product.price) * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-text-muted text-sm">
                            ${item.product.price} each
                          </div>
                        </div>
                      </div>

                      {/* Stock Warning */}
                      {item.product.stockQuantity && item.product.stockQuantity <= 3 && (
                        <div className="mt-3 text-orange-400 text-sm">
                          Only {item.product.stockQuantity} left in stock
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </GlassCard>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link href="/products">
                <Button variant="outline" className="glass border-glass-border">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 sticky top-32">
              <h2 className="font-bebas text-2xl mb-6">ORDER SUMMARY</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-400">Free</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                
                <Separator className="bg-glass-border" />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping Notice */}
              {shipping > 0 && (
                <div className="mt-4 p-3 glass rounded-lg text-sm text-text-secondary">
                  <p>Free shipping on orders over $100</p>
                  <p className="text-accent-blue">
                    Add ${(100 - subtotal).toFixed(2)} more to qualify
                  </p>
                </div>
              )}

              {/* Checkout Button */}
              <Link href="/checkout">
                <Button className="w-full mt-6 bg-accent-blue hover:bg-blue-500 text-white">
                  Proceed to Checkout
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>

              {/* Security Notice */}
              <div className="mt-4 text-center text-sm text-text-muted">
                🔒 Secure checkout with 256-bit SSL encryption
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
