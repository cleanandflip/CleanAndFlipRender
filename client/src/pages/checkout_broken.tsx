import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useElements, useStripe, Elements, PaymentElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { fetchDefaultAddress, saveAddress, Address } from "@/api/addresses";
import { getQuote, Quote } from "@/api/checkout";
import { ShoppingCart, CreditCard, Truck, Lock, ArrowLeft } from "lucide-react";

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const AddressSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  street1: z.string().min(1, "Required"),
  street2: z.string().optional(),
  city: z.string().min(1, "Required"),
  state: z.string().length(2, "Use 2-letter code"),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, "ZIP code invalid"),
  country: z.string().default("US"),
  deliveryInstructions: z.string().optional(),
  saveToProfile: z.boolean().default(false),
  billingSameAsShipping: z.boolean().default(true),
});

type AddressForm = z.infer<typeof AddressSchema>;

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
      <Card className="p-6 mb-6">
        <h3 className="font-bebas text-xl mb-4 flex items-center">
          <CreditCard className="mr-2" size={20} />
          PAYMENT INFORMATION
        </h3>
        <PaymentElement />
      </Card>
      
      <Button 
        type="submit" 
        className="w-full py-3 bg-accent-blue hover:bg-blue-500 text-white"
        disabled={!stripe || isProcessing}
        data-testid="button-completeOrder"
      >
        {isProcessing ? "Processing..." : "Complete Order"}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const { cartItems, cartTotal, cartCount } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState("");
  const isAuthenticated = !!user;

  const { register, handleSubmit, setValue, watch, trigger,
    formState: { errors, isValid, isSubmitting } } =
    useForm<AddressForm>({ 
      resolver: zodResolver(AddressSchema), 
      mode: "onChange", 
      defaultValues: { 
        country: "US", 
        billingSameAsShipping: true 
      } 
    });

  // Autofill address for authenticated users
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      const addr = await fetchDefaultAddress();
      if (!addr) return;
      const map: Partial<AddressForm> = {
        firstName: addr.firstName, 
        lastName: addr.lastName, 
        email: addr.email, 
        phone: addr.phone,
        street1: addr.street1, 
        street2: addr.street2, 
        city: addr.city, 
        state: addr.state,
        postalCode: addr.postalCode, 
        country: addr.country ?? "US",
      };
      for (const [k, v] of Object.entries(map)) {
        setValue(k as keyof AddressForm, v ?? "");
      }
      await trigger();
    })();
  }, [isAuthenticated, setValue, trigger]);

  // Auto-quote when address is valid
  const postalCode = watch("postalCode");
  const state = watch("state");
  useEffect(() => {
    const reQuote = async () => {
      const ok = await trigger(["street1", "city", "state", "postalCode"]);
      if (!ok) return;
      const addr: Address = {
        firstName: watch("firstName"), 
        lastName: watch("lastName"), 
        email: watch("email"),
        street1: watch("street1"), 
        street2: watch("street2"), 
        city: watch("city"),
        state: watch("state"), 
        postalCode: watch("postalCode"), 
        country: watch("country") || "US",
      };
      try { 
        setQuote(await getQuote(addr)); 
      } catch (error) {
        // Silently handle quote errors
        console.warn("Quote error:", error);
      }
    };
    if (postalCode && state) reQuote();
  }, [postalCode, state, watch, trigger]);

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
      setStep(2);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AddressForm) => {
    if (isAuthenticated && data.saveToProfile) {
      await saveAddress({
        firstName: data.firstName, 
        lastName: data.lastName, 
        email: data.email, 
        phone: data.phone,
        street1: data.street1, 
        street2: data.street2, 
        city: data.city, 
        state: data.state,
        postalCode: data.postalCode, 
        country: data.country, 
        isDefault: true
      });
    }
    
    const subtotal = cartTotal;
    const shipping = quote?.shippingMethods?.[0]?.price ?? (subtotal > 100 ? 0 : 25);
    const tax = quote?.tax ?? (subtotal * 0.08);
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
          <Card className="p-12 text-center">
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
          </Card>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <div className="min-h-screen pt-32 px-6 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={() => setStep(1)}
                data-testid="button-backToShipping"
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Shipping
              </Button>
              <h1 className="text-3xl font-bold mb-2">Complete Your Order</h1>
              <p className="text-text-secondary">Review and confirm your purchase</p>
            </div>
            <CheckoutForm />
          </div>
        </div>
      </Elements>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-text-secondary">Complete your purchase securely</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 rounded-2xl border-2 border-white/15 hover:border-white/25 transition-colors">
            <h2 className="text-xl mb-4">Shipping Information</h2>
            
            {!isAuthenticated && (
              <div className="mb-4 text-sm text-white/70">
                Have an account? <Link href="/auth" className="underline text-blue-400 hover:text-blue-300">Sign in</Link> to auto-fill your saved address.
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium" htmlFor="firstName">First Name</label>
                <Input 
                  id="firstName" 
                  autoComplete="given-name" 
                  aria-invalid={!!errors.firstName} 
                  data-testid="input-firstName"
                  {...register("firstName")} 
                />
                {errors.firstName && (
                  <p role="alert" className="mt-1 text-sm text-red-400">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium" htmlFor="lastName">Last Name</label>
                <Input 
                  id="lastName" 
                  autoComplete="family-name" 
                  aria-invalid={!!errors.lastName} 
                  data-testid="input-lastName"
                  {...register("lastName")} 
                />
                {errors.lastName && (
                  <p role="alert" className="mt-1 text-sm text-red-400">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block mb-1 text-sm font-medium" htmlFor="email">Email</label>
                <Input 
                  id="email" 
                  type="email" 
                  autoComplete="email" 
                  aria-invalid={!!errors.email} 
                  data-testid="input-email"
                  {...register("email")} 
                />
                {errors.email && (
                  <p role="alert" className="mt-1 text-sm text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium" htmlFor="phone">Phone (optional)</label>
                <Input 
                  id="phone" 
                  type="tel" 
                  autoComplete="tel" 
                  placeholder="###-###-####"
                  data-testid="input-phone"
                  {...register("phone")} 
                />
              </div>
            </div>

            {/* Address Fields */}
            <div className="mt-4">
              <label className="block mb-1 text-sm font-medium" htmlFor="street1">Street Address</label>
              <Input 
                id="street1" 
                autoComplete="address-line1" 
                aria-invalid={!!errors.street1} 
                placeholder="123 Main Street"
                data-testid="input-street1"
                {...register("street1")} 
              />
              {errors.street1 && (
                <p role="alert" className="mt-1 text-sm text-red-400">
                  {errors.street1.message}
                </p>
              )}
            </div>
            
            <div className="mt-4">
              <label className="block mb-1 text-sm font-medium" htmlFor="street2">Apartment, suite, etc. (optional)</label>
              <Input 
                id="street2" 
                autoComplete="address-line2" 
                data-testid="input-street2"
                {...register("street2")} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block mb-1 text-sm font-medium" htmlFor="city">City</label>
                <Input 
                  id="city" 
                  autoComplete="address-level2" 
                  aria-invalid={!!errors.city} 
                  data-testid="input-city"
                  {...register("city")} 
                />
                {errors.city && (
                  <p role="alert" className="mt-1 text-sm text-red-400">
                    {errors.city.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium" htmlFor="state">State</label>
                <Input 
                  id="state" 
                  autoComplete="address-level1" 
                  aria-invalid={!!errors.state} 
                  maxLength={2} 
                  placeholder="NC"
                  data-testid="input-state" 
                  {...register("state")} 
                />
                {errors.state && (
                  <p role="alert" className="mt-1 text-sm text-red-400">
                    {errors.state.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium" htmlFor="postalCode">ZIP</label>
                <Input 
                  id="postalCode" 
                  autoComplete="postal-code" 
                  aria-invalid={!!errors.postalCode} 
                  inputMode="numeric"
                  data-testid="input-postalCode" 
                  {...register("postalCode")} 
                />
                {errors.postalCode && (
                  <p role="alert" className="mt-1 text-sm text-red-400">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block mb-1 text-sm font-medium" htmlFor="deliveryInstructions">Delivery Instructions (optional)</label>
              <Textarea 
                id="deliveryInstructions" 
                rows={3} 
                data-testid="textarea-deliveryInstructions"
                {...register("deliveryInstructions")} 
              />
            </div>

            <div className="mt-4 space-y-2">
              {isAuthenticated && (
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    data-testid="checkbox-saveToProfile"
                    {...register("saveToProfile")} 
                  /> 
                  Save this address to my profile
                </label>
              )}
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  data-testid="checkbox-billingSameAsShipping"
                  {...register("billingSameAsShipping")} 
                /> 
                Billing same as shipping
              </label>
            </div>

            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="mt-6 w-full rounded-xl h-12 font-medium bg-sky-500 disabled:bg-white/10 hover:bg-sky-400 transition-colors"
              data-testid="button-continueToPayment"
            >
              {isSubmitting ? "Processing..." : "Continue to Payment"}
            </Button>
          </form>

          {/* Order Summary */}
          <aside className="p-6 rounded-2xl border-2 border-white/15 hover:border-white/25 transition-colors">
            <h3 className="text-lg mb-4">Order Summary</h3>
            
            {/* Cart Items */}
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                    {item.product.images?.[0] && (
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.product.name}</h4>
                    <p className="text-xs text-white/60">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium">${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="mt-4 text-sm text-white/80" aria-live="polite">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span data-testid="text-subtotal">
                  {quote ? `$${quote.subtotal.toFixed(2)}` : `$${cartTotal.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span data-testid="text-shipping">
                  {quote?.shippingMethods?.[0] 
                    ? `$${quote.shippingMethods[0].price.toFixed(2)}` 
                    : "Calculated at next step"
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span data-testid="text-tax">
                  {quote ? `$${quote.tax.toFixed(2)}` : "—"}
                </span>
              </div>
              <div className="mt-2 border-t border-white/15 pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span data-testid="text-total">
                  {quote ? `$${quote.total.toFixed(2)}` : "—"}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
}