import { ShoppingCart, Truck, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface OrderSummaryProps {
  items: any[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  isLocal: boolean;
}

export function OrderSummary({ 
  items, 
  subtotal, 
  tax, 
  shipping, 
  total, 
  isLocal 
}: OrderSummaryProps) {
  const getImageUrl = (imageData: any) => {
    if (!imageData) return null;
    return typeof imageData === 'string' ? imageData : imageData?.url;
  };
  
  return (
    <Card className="p-6 sticky top-4">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" />
        Order Summary
      </h2>
      
      {/* Items List */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
              {getImageUrl(item.images?.[0]) ? (
                <img 
                  src={getImageUrl(item.images[0])}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-text-primary truncate">
                {item.name}
              </p>
              <p className="text-xs text-text-secondary">
                Qty: {item.quantity} × ${item.price}
              </p>
            </div>
            <div className="text-sm font-medium">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      
      <Separator className="mb-4" />
      
      {/* Pricing Breakdown */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal ({items.length} items)</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Tax (8.75%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            {isLocal ? 'FREE Local Delivery' : 'Standard Shipping'}
          </span>
          <span className={isLocal ? 'text-green-600 font-medium' : ''}>
            {isLocal ? 'FREE' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
      </div>
      
      <Separator className="mb-4" />
      
      {/* Total */}
      <div className="flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
      
      {/* Local Customer Badge */}
      {isLocal && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              You're saving on delivery! Free local delivery to your doorstep.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}