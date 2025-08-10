import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { ArrowLeft, Lock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PaymentStepProps {
  user: any;
  checkoutData: any;
  items: any[];
  total: number;
  onBack: () => void;
  clearCart: () => void;
}

export function PaymentStep({ 
  user, 
  checkoutData, 
  items, 
  total, 
  onBack, 
  clearCart 
}: PaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Create payment intent when component mounts
  useState(() => {
    createPaymentIntent();
  });
  
  const createPaymentIntent = async () => {
    try {
      const response = await apiRequest('POST', '/api/payments/create-intent', {
        amount: Math.round(total * 100), // Convert to cents
        currency: 'usd',
        deliveryAddress: checkoutData.deliveryAddress,
        deliveryMethod: checkoutData.deliveryMethod,
        notes: checkoutData.notes,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      });
      
      setClientSecret(response.clientSecret);
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order/success`,
        },
        redirect: 'if_required'
      });
      
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Create order record
        await apiRequest('POST', '/api/orders', {
          paymentIntentId: paymentIntent.id,
          deliveryAddress: checkoutData.deliveryAddress,
          deliveryMethod: checkoutData.deliveryMethod,
          notes: checkoutData.notes,
          items: items
        });
        
        // Clear cart and redirect
        clearCart();
        toast({
          title: "Order Placed Successfully!",
          description: "Thank you for your purchase. You'll receive a confirmation email shortly.",
        });
        
        // Redirect to success page
        window.location.href = `/order/success?payment_intent=${paymentIntent.id}`;
      }
    } catch (error: any) {
      toast({
        title: "Order Error",
        description: error.message || "Failed to complete your order",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-text-primary">Payment Information</h2>
      
      {/* Security Notice */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">
              Secure Checkout
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Your payment information is encrypted and processed securely through Stripe.
            </p>
          </div>
        </div>
      </div>
      
      {/* Payment Form */}
      {clientSecret ? (
        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold">Payment Details</h3>
            </div>
            
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
              }}
            />
          </Card>
          
          {/* Order Summary */}
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Items ({items.length})</span>
                <span>${(total - (checkoutData.deliveryMethod === 'standard' ? 9.99 : 0) - (total * 0.0875)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery</span>
                <span className={checkoutData.deliveryMethod === 'local_delivery' ? 'text-green-600 font-medium' : ''}>
                  {checkoutData.deliveryMethod === 'local_delivery' ? 'FREE' : '$9.99'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${(total * 0.0875).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
          
          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack} 
              className="min-w-32"
              disabled={isProcessing}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              className="min-w-40"
              disabled={!stripe || !elements || isProcessing}
            >
              {isProcessing ? 'Processing...' : `Complete Order - $${total.toFixed(2)}`}
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
          <p className="mt-4 text-text-secondary">Initializing secure payment...</p>
        </div>
      )}
    </div>
  );
}