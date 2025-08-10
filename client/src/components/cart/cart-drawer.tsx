import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, X } from "lucide-react";
import { ROUTES, routes } from "@/config/routes";

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    cartTotal, 
    cartCount, 
    isLoading 
  } = useCart();

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (onClose) {
      if (!newOpen) onClose();
    } else {
      setInternalOpen(newOpen);
    }
  };

  const subtotal = cartTotal;
  const shipping = subtotal > 100 ? 0 : 25;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="bg-card border-bg-card-border w-full sm:w-96 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-bebas text-xl">
                SHOPPING CART
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenChange(false)}
                className="hover:bg-white/10"
              >
                <X size={20} />
              </Button>
            </div>
            {cartCount > 0 && (
              <p className="text-text-secondary text-sm">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </p>
            )}
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {isLoading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-16 h-16 bg-bg-card-bg rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-bg-card-bg rounded w-3/4"></div>
                        <div className="h-3 bg-bg-card-bg rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <ShoppingBag className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
                  <p className="text-text-secondary text-sm mb-6">
                    Start shopping to add items to your cart.
                  </p>
                  <Link href={ROUTES.PRODUCTS}>
                    <Button 
                      className="bg-accent-blue hover:bg-blue-500"
                      onClick={() => handleOpenChange(false)}
                    >
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-6">
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="bg-card rounded-lg p-4">
                        <div className="flex gap-3">
                          {/* Product Image */}
                          <Link href={routes.productDetail(item.product.id)}>
                            <img
                              src={item.product.images?.[0] || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleOpenChange(false)}
                            />
                          </Link>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 min-w-0">
                                <Link href={routes.productDetail(item.product.id)}>
                                  <h4 
                                    className="font-medium text-sm hover:text-accent-blue transition-colors cursor-pointer line-clamp-2"
                                    onClick={() => handleOpenChange(false)}
                                  >
                                    {item.product.name}
                                  </h4>
                                </Link>
                                {item.product.brand && (
                                  <p className="text-text-muted text-xs">{item.product.brand}</p>
                                )}
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-gray-400 hover:text-red-400 transition-colors p-1 ml-2"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="flex items-center justify-between">
                              {/* Quantity Controls */}
                              <div className="flex items-center bg-card rounded">
                                <button
                                  onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                  className="p-1 hover:bg-white/10 transition-colors"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="px-2 py-1 text-sm min-w-[2rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-1 hover:bg-white/10 transition-colors"
                                  disabled={!item.product.stockQuantity || item.quantity >= item.product.stockQuantity}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <div className="font-semibold text-sm">
                                  ${(Number(item.product.price) * item.quantity).toFixed(2)}
                                </div>
                                <div className="text-text-muted text-xs">
                                  ${item.product.price} each
                                </div>
                              </div>
                            </div>

                            {/* Stock Warning */}
                            {item.product.stockQuantity && item.product.stockQuantity <= 3 && (
                              <div className="mt-2 text-red-400 text-xs">
                                Only {item.product.stockQuantity} left
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-bg-card-border mt-auto">
                  {/* Summary */}
                  <div className="bg-card rounded-lg p-4 mb-4">
                    <div className="space-y-2 text-sm">
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
                      <Separator className="bg-bg-card-border" />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Free Shipping Notice */}
                  {shipping > 0 && (
                    <div className="mb-4 p-3 bg-card rounded-lg text-sm text-text-secondary">
                      <p>Free shipping on orders over $100</p>
                      <p className="text-accent-blue">
                        Add ${(100 - subtotal).toFixed(2)} more to qualify
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link href={ROUTES.CART}>
                      <Button 
                        variant="outline" 
                        className="w-full bg-card border-bg-card-border"
                        onClick={() => handleOpenChange(false)}
                      >
                        View Cart
                      </Button>
                    </Link>
                    
                    <Link href={ROUTES.CHECKOUT}>
                      <Button 
                        className="w-full bg-accent-blue hover:bg-blue-500 text-primary"
                        onClick={() => handleOpenChange(false)}
                      >
                        Checkout
                        <ArrowRight className="ml-2" size={16} />
                      </Button>
                    </Link>
                  </div>

                  {/* Security Notice */}
                  <div className="mt-4 text-center text-xs text-text-muted">
                    🔒 Secure checkout with SSL encryption
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
