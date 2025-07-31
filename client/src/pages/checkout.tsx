import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useElements, useStripe, Elements, PaymentElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import GlassCard from "@/components/common/glass-card";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShoppingCart, CreditCard, Truck, Lock, ArrowLeft } from "lucide-react";
import AddressAutocomplete from "@/components/ui/address-autocomplete";
import { ParsedAddress } from "@/utils/location";

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const shippingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Valid ZIP code is required"),
  instructions: z.string().optional(),
});

type ShippingForm = z.infer<typeof shippingSchema>;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase!",
      });
      navigate("/order/success");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <GlassCard className="p-6 mb-6">
        <h3 className="font-bebas text-xl mb-4 flex items-center">
          <CreditCard className="mr-2" size={20} />
          PAYMENT INFORMATION
        </h3>
        <PaymentElement />
      </GlassCard>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-accent-blue hover:bg-blue-500 text-white py-3"
      >
        {isProcessing ? "Processing..." : "Complete Order"}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const { cartItems, cartTotal, cartCount, clearCart } = useCart();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [step, setStep] = useState(1);
  const [shippingInfo, setShippingInfo] = useState<ShippingForm | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<ParsedAddress | null>(null);

  const form = useForm<ShippingForm>({
    resolver: zodResolver(shippingSchema),
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: orderData.total,
        metadata: {
          customerEmail: orderData.email,
          items: JSON.stringify(cartItems.map(item => ({ 
            id: item.productId, 
            name: item.product.name, 
            quantity: item.quantity 
          }))),
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onShippingSubmit = (data: ShippingForm) => {
    setShippingInfo(data);
    setStep(2);
    
    const subtotal = cartTotal;
    const shipping = subtotal > 100 ? 0 : 25;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    createPaymentIntentMutation.mutate({
      ...data,
      subtotal,
      shipping,
      tax,
      total,
    });
  };

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-12 text-center">
            <ShoppingCart className="mx-auto mb-6 text-gray-400" size={64} />
            <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-text-secondary mb-8">
              Add some items to your cart before proceeding to checkout.
            </p>
            <Link href="/products">
              <Button className="bg-accent-blue hover:bg-blue-500 text-white">
                Continue Shopping
              </Button>
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  const subtotal = cartTotal;
  const shipping = subtotal > 100 ? 0 : 25;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-bebas text-4xl md:text-6xl">CHECKOUT</h1>
          <Link href="/cart">
            <Button variant="outline" className="glass border-glass-border">
              <ArrowLeft className="mr-2" size={18} />
              Back to Cart
            </Button>
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-accent-blue text-white' : 'glass text-text-muted'
              }`}>
                1
              </div>
              <span className={step >= 1 ? 'text-white' : 'text-text-muted'}>Shipping</span>
              <div className={`w-12 h-px ${step >= 2 ? 'bg-accent-blue' : 'bg-glass-border'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-accent-blue text-white' : 'glass text-text-muted'
              }`}>
                2
              </div>
              <span className={step >= 2 ? 'text-white' : 'text-text-muted'}>Payment</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onShippingSubmit)} className="space-y-6">
                  <GlassCard className="p-6">
                    <h3 className="font-bebas text-xl mb-4 flex items-center">
                      <Truck className="mr-2" size={20} />
                      SHIPPING INFORMATION
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="glass border-glass-border" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="glass border-glass-border" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" className="glass border-glass-border" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} className="glass border-glass-border" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Address Autocomplete */}
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Address</Label>
                      <AddressAutocomplete
                        value={selectedAddress}
                        onChange={(address) => {
                          setSelectedAddress(address);
                          if (address) {
                            form.setValue('street', address.street);
                            form.setValue('city', address.city);
                            form.setValue('state', address.state);
                            form.setValue('zipCode', address.zipCode);
                          }
                        }}
                        placeholder="Start typing your address..."
                        className="glass border-glass-border text-white placeholder:text-text-muted mt-2"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} className="glass border-glass-border" readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} className="glass border-glass-border" readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} className="glass border-glass-border" readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Delivery Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Gate code, special instructions, etc." className="glass border-glass-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </GlassCard>

                  <Button type="submit" className="w-full bg-accent-blue hover:bg-blue-500 text-white py-3">
                    Continue to Payment
                  </Button>
                </form>
              </Form>
            )}

            {step === 2 && clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm />
              </Elements>
            )}

            {step === 2 && !clientSecret && (
              <GlassCard className="p-6">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p>Setting up payment...</p>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 sticky top-32">
              <h3 className="font-bebas text-xl mb-4">ORDER SUMMARY</h3>
              
              {/* Items */}
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-text-muted">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-medium">
                      ${(Number(item.product.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="bg-glass-border mb-4" />

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
                
                <Separator className="bg-glass-border" />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 text-center text-sm text-text-muted">
                <Lock className="inline mr-1" size={14} />
                Secure 256-bit SSL encryption
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
