import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useElements, useStripe, Elements, PaymentElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { addressApi, type Address } from "@/api/addresses";
import { getQuote, Quote } from "@/api/checkout";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { ShoppingCart, CreditCard, Truck, Lock, ArrowLeft, MapPin } from "lucide-react";

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
  makeDefault: z.boolean().default(false),
  billingSameAsShipping: z.boolean().default(true),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
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
        description: "Your order has been placed successfully!",
      });
      navigate("/order/success");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border-2 border-white/15 hover:border-white/25 transition-colors">
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
  // CRASH FIX: Array-safe helpers to prevent undefined.map crashes
  const asArray = <T,>(x: T[] | null | undefined): T[] => Array.isArray(x) ? x : [];
  
  const { data: cartData, isLoading: cartLoading } = useQuery({ queryKey: ['/api/cart'] });
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState("");
  const [addressInputValue, setAddressInputValue] = useState("");
  const isAuthenticated = !!user;

  // SAFE CART DATA: Ensure cartItems is always an array with proper typing
  const cartItems = asArray(cartData?.items || []).map((item: any) => ({
    id: item.id || item.productId,
    productId: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    product: item.product || { name: item.name, price: item.price }
  }));
  const cartTotal = cartData?.total ?? 0;
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch default address using SSOT
  const { data: defaultAddress } = useQuery({
    queryKey: ['/api/addresses', 'default'],
    queryFn: () => addressApi.getDefaultAddress(),
    enabled: !!user,
  });

  const { register, handleSubmit, setValue, watch, trigger, reset,
    formState: { errors, isValid, isSubmitting } } =
    useForm<AddressForm>({ 
      resolver: zodResolver(AddressSchema), 
      mode: "onChange", 
      defaultValues: { 
        country: "US", 
        billingSameAsShipping: true 
      } 
    });

  // SSOT autofill: populate form from user profile and default address
  useEffect(() => {
    if (!user || !defaultAddress) return;

    // Use react-hook-form reset to populate all fields at once
    reset({
      firstName: defaultAddress.firstName || user.firstName || "",
      lastName: defaultAddress.lastName || user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      street1: defaultAddress.street1 || "",
      street2: defaultAddress.street2 || "",
      city: defaultAddress.city || "",
      state: defaultAddress.state || "",
      postalCode: defaultAddress.postalCode || "",
      country: defaultAddress.country || "US",
      deliveryInstructions: "",
      saveToProfile: false,
      makeDefault: false,
      billingSameAsShipping: true,
      latitude: defaultAddress.latitude,
      longitude: defaultAddress.longitude
    });

    // Update autocomplete input value  
    setAddressInputValue(defaultAddress.street1 || "");
  }, [user, defaultAddress, reset]);

  // Handle address selection from autocomplete
  const handleAddressSelect = (addressData: { street1: string; city: string; state: string; postalCode: string }) => {
    setValue("street1", addressData.street1 || "");
    setValue("city", addressData.city || "");
    setValue("state", addressData.state || "");
    setValue("postalCode", addressData.postalCode || "");
    
    // Update the input value to match the selected address
    setAddressInputValue(addressData.street1 || "");
    
    // Trigger validation for the updated fields
    trigger(["street1", "city", "state", "postalCode"]);
  };

  // Watch for changes to trigger quote updates
  const watchedFields = watch();
  
  const getQuoteMutation = useMutation({
    mutationFn: async (data: AddressForm) => {
      const quoteData = await getQuote({
        street1: data.street1,
        street2: data.street2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
      });
      setQuote(quoteData);
      return quoteData;
    },
    onError: (error) => {
      toast({
        title: "Quote Error",
        description: "Unable to calculate shipping. Please check your address.",
        variant: "destructive",
      });
    },
  });

  // Get quote when form is valid
  useEffect(() => {
    if (isValid && !isSubmitting && watchedFields.street1 && watchedFields.city && watchedFields.state && watchedFields.postalCode) {
      getQuoteMutation.mutate(watchedFields);
    }
  }, [isValid, watchedFields.street1, watchedFields.city, watchedFields.state, watchedFields.postalCode]);

  const onSubmit = async (data: AddressForm) => {
    if (!quote) {
      toast({
        title: "Missing Quote", 
        description: "Please wait for shipping calculation to complete.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create payment intent
      const response = await apiRequest("POST", "/api/checkout/create-payment-intent", {
        shippingAddress: {
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
          deliveryInstructions: data.deliveryInstructions,
        },
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        amount: Math.round(quote.total * 100), // Convert to cents
      });

      const responseData = await response.json();

      if (responseData.clientSecret) {
        setClientSecret(responseData.clientSecret);
        setStep(2);
      }
    } catch (error) {
      toast({
        title: "Checkout Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // LOADING GUARD: Wait for all data before rendering
  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen pt-32 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto mb-4"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartCount === 0) {
    return (
      <div className="min-h-screen pt-32 px-6 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <ShoppingCart className="mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-text-secondary mb-8">Add some items to your cart before checking out.</p>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
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

            {/* Email and Phone */}
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
                <label className="block mb-1 text-sm font-medium" htmlFor="phone">Phone (Optional)</label>
                <Input 
                  id="phone" 
                  type="tel" 
                  autoComplete="tel" 
                  data-testid="input-phone"
                  {...register("phone")} 
                />
              </div>
            </div>

            {/* Address with Autocomplete */}
            <div className="mt-4">
              <label className="block mb-1 text-sm font-medium" htmlFor="street1">Street Address</label>
              <AddressAutocomplete
                value={addressInputValue}
                placeholder="Start typing your address..."
                onAddressSelect={handleAddressSelect}
                className="w-full"
              />
              {errors.street1 && (
                <p role="alert" className="mt-1 text-sm text-red-400">
                  {errors.street1.message}
                </p>
              )}
            </div>

            <div className="mt-4">
              <label className="block mb-1 text-sm font-medium" htmlFor="street2">Apartment, suite, etc. (Optional)</label>
              <Input 
                id="street2" 
                autoComplete="address-line2" 
                data-testid="input-street2"
                {...register("street2")} 
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
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
                  data-testid="input-state"
                  placeholder="CA"
                  {...register("state")} 
                />
                {errors.state && (
                  <p role="alert" className="mt-1 text-sm text-red-400">
                    {errors.state.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium" htmlFor="postalCode">ZIP Code</label>
                <Input 
                  id="postalCode" 
                  autoComplete="postal-code" 
                  aria-invalid={!!errors.postalCode} 
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

            {/* Special Instructions */}
            <div className="mt-4">
              <label className="block mb-1 text-sm font-medium" htmlFor="deliveryInstructions">Delivery Instructions (Optional)</label>
              <Textarea 
                id="deliveryInstructions" 
                placeholder="Special delivery instructions, gate codes, etc."
                data-testid="textarea-deliveryInstructions"
                {...register("deliveryInstructions")} 
              />
            </div>

            {/* SSOT Address Options */}
            {isAuthenticated && (
              <div className="mt-4 space-y-3">
                <div className="p-3 rounded border border-white/10 bg-white/5">
                  <MapPin className="inline mr-2" size={16} />
                  <span className="text-sm font-medium">Address Options</span>
                  
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <Checkbox 
                        data-testid="checkbox-saveToProfile"
                        {...register("saveToProfile")} 
                      />
                      <span className="ml-2 text-sm">Save this address to my profile</span>
                    </label>
                    
                    {watch("saveToProfile") && (
                      <label className="flex items-center ml-4">
                        <Checkbox 
                          data-testid="checkbox-makeDefault"
                          {...register("makeDefault")} 
                        />
                        <span className="ml-2 text-sm">Make this my default address</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full mt-6 bg-accent-blue hover:bg-blue-500 text-white"
              disabled={!isValid || isSubmitting || getQuoteMutation.isPending}
              data-testid="button-continueToPayment"
            >
              {getQuoteMutation.isPending ? "Calculating shipping..." : "Continue to Payment"}
            </Button>
          </form>

          <aside className="p-6 rounded-2xl border-2 border-white/15">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ShoppingCart className="mr-2" size={20} />
              Order Summary
            </h3>

            {/* Cart Items */}
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-white/70">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-medium">
                    ${(item.product.price * item.quantity).toFixed(2)}
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
    </div>
  );
}