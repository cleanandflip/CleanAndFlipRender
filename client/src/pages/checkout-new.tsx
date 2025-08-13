import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/ui/page-loader";
import { useAddresses } from "@/hooks/use-addresses";
import { CheckoutSkeleton } from "@/components/ui/checkout-skeleton";
import { AddressBlock } from "@/components/checkout/AddressBlock";
import { useAuth } from "@/hooks/use-auth";
import AddressPicker from "@/components/addresses/AddressPicker";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { apiRequest } from "@/lib/queryClient";
// Helper functions
const cents = (amount: number) => Math.round(amount * 100);
const money = (centsAmount: number) => `$${(centsAmount / 100).toFixed(2)}`;

const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"), 
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  street: z.string().min(1, "Street address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().default("US"),
  geoapify_place_id: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  saveToProfile: z.boolean().default(false),
  deliveryInstructions: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;
type AddressMode = "default" | "saved" | "new";

export default function CheckoutNew() {
  const { addresses, defaultAddress, isLoading } = useAddresses();
  
  if (isLoading) return <CheckoutSkeleton />;

  // If no addresses exist, start in "new address" mode
  const hasSaved = !!defaultAddress;

  return (
    <CheckoutShell
      initialMode={hasSaved ? "default" : "new"}
      defaultAddress={defaultAddress ?? undefined}
      addresses={addresses}
    />
  );
}

function CheckoutShell({
  initialMode,
  defaultAddress,
  addresses
}: {
  initialMode: "default" | "new";
  defaultAddress?: any;
  addresses: any[];
}) {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [mode, setMode] = useState<AddressMode>("default");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      street: "",
      address2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
      saveToProfile: false,
      deliveryInstructions: "",
    },
  });

  // Queries
  const { user, isLoading: userLoading } = useAuth();
  const { addresses, defaultAddress, isLoading: addrLoading } = useAddresses();
  
  const { data: cartResp, isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
    staleTime: 30_000,
  });
  
  const cartItems = (cartResp as any)?.items || [];

  // Address-based quote key
  const quoteKey = mode === "new" 
    ? `${form.watch("street")}-${form.watch("city")}-${form.watch("state")}-${form.watch("zipCode")}`
    : selectedAddressId;

  const { data: quotesResp, isLoading: quotesLoading, refetch: refetchQuotes } = useQuery({
    queryKey: ["shipping:quotes", quoteKey],
    queryFn: async () => {
      if (mode === "new") {
        const values = form.getValues();
        if (!values.street || !values.city || !values.state || !values.zipCode) return null;
        return apiRequest("/api/shipping/quotes", {
          method: 'POST',
          body: JSON.stringify({
            street: values.street,
            city: values.city,
            state: values.state,
            zipCode: values.zipCode,
            country: values.country,
            latitude: values.latitude,
            longitude: values.longitude,
          })
        });
      } else if (selectedAddressId) {
        return apiRequest("/api/shipping/quotes", {
          method: 'POST',
          body: JSON.stringify({ addressId: selectedAddressId })
        });
      }
      return null;
    },
    enabled: (mode === "new" && form.watch("street") && form.watch("city") && form.watch("state") && form.watch("zipCode")) || 
             (mode !== "new" && !!selectedAddressId),
    staleTime: 0,
  });
  
  const quotes = (quotesResp as any)?.quotes ?? [];

  // Auto-prefill and mode initialization
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!prefilledRef.current && !userLoading && !addrLoading) {
      if (defaultAddress) {
        setMode("default");
        setSelectedAddressId(defaultAddress.id);
        
        const formData = {
          firstName: user?.firstName ?? "",
          lastName: user?.lastName ?? "",
          email: user?.email ?? "",
          phone: user?.phone ?? "",
          street: defaultAddress.street1 ?? defaultAddress.street ?? "",
          address2: defaultAddress.street2 ?? defaultAddress.address2 ?? "",
          city: defaultAddress.city ?? "",
          state: defaultAddress.state ?? "",
          zipCode: defaultAddress.postalCode ?? defaultAddress.zipCode ?? "",
          country: defaultAddress.country ?? "US",
          geoapify_place_id: defaultAddress.geoapify_place_id ?? "",
          latitude: defaultAddress.latitude ?? null,
          longitude: defaultAddress.longitude ?? null,
          saveToProfile: false,
          deliveryInstructions: "",
        };
        form.reset(formData);
      } else {
        setMode("new");
      }
      prefilledRef.current = true;
    }
  }, [defaultAddress, user, userLoading, addrLoading, form]);

  // Handle address mode changes
  const handleModeChange = (newMode: AddressMode) => {
    setMode(newMode);
    setSelectedQuoteId(null);
    
    if (newMode === "default" && defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
      form.reset({
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        street: defaultAddress.street1 ?? defaultAddress.street ?? "",
        address2: defaultAddress.street2 ?? defaultAddress.address2 ?? "",
        city: defaultAddress.city ?? "",
        state: defaultAddress.state ?? "",
        zipCode: defaultAddress.postalCode ?? defaultAddress.zipCode ?? "",
        country: defaultAddress.country ?? "US",
        geoapify_place_id: defaultAddress.geoapify_place_id ?? "",
        latitude: defaultAddress.latitude ?? null,
        longitude: defaultAddress.longitude ?? null,
        saveToProfile: false,
        deliveryInstructions: "",
      });
    } else if (newMode === "new") {
      setSelectedAddressId(null);
    }
  };

  const handleAddressPick = (addressId: string) => {
    setSelectedAddressId(addressId);
    const addr = addresses.find(a => a.id === addressId);
    if (addr) {
      form.reset({
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        street: addr.street1 ?? addr.street ?? "",
        address2: addr.street2 ?? addr.address2 ?? "",
        city: addr.city ?? "",
        state: addr.state ?? "",
        zipCode: addr.postalCode ?? addr.zipCode ?? "",
        country: addr.country ?? "US",
        geoapify_place_id: addr.geoapify_place_id ?? "",
        latitude: addr.latitude ?? null,
        longitude: addr.longitude ?? null,
        saveToProfile: false,
        deliveryInstructions: "",
      });
    }
  };

  // Submit checkout
  const submitCheckout = useMutation({
    mutationFn: async (payload: any) => apiRequest("/api/checkout/submit", {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    onSuccess: ({ url }: any) => {
      window.location.href = url;
    },
    onError: () => toast({ title: "Checkout failed", variant: "destructive" }),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    let shippingAddressId = selectedAddressId;

    if (mode === "new" || values.saveToProfile) {
      const created = await apiRequest("/api/addresses", {
        method: 'POST',
        body: JSON.stringify({
        firstName: values.firstName,
        lastName: values.lastName,
        street1: values.street,
        street2: values.address2 || null,
        city: values.city,
        state: values.state,
        postalCode: values.zipCode,
        country: values.country,
        geoapify_place_id: values.geoapify_place_id || null,
        latitude: values.latitude ?? null,
        longitude: values.longitude ?? null,
        is_default: !selectedAddressId,
        })
      });
      shippingAddressId = (created as any)?.id || (created as any)?.address?.id || null;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["addresses"] }),
        qc.invalidateQueries({ queryKey: ["user"] }),
      ]);
    }

    if (!selectedQuoteId) {
      toast({ title: "Choose a shipping option", variant: "destructive" });
      return;
    }

    await submitCheckout.mutateAsync({
      addressId: shippingAddressId,
      quoteId: selectedQuoteId,
      contact: { email: values.email, phone: values.phone },
      deliveryInstructions: values.deliveryInstructions || "",
    });
  });

  // Loading states
  if (userLoading || cartLoading) return <PageLoader />;
  
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 px-6 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-text-secondary mb-8">Add some items to your cart before checking out.</p>
          <Button onClick={() => navigate("/products")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  const isAddressValid = mode !== "new" || (
    form.watch("street") && 
    form.watch("city") && 
    form.watch("state") && 
    form.watch("zipCode")
  );

  return (
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <Form {...form}>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-8" onSubmit={onSubmit}>
            <div className="md:col-span-2 space-y-6">
              <section className="p-6 rounded-2xl border-2 border-white/15 hover:border-white/25 transition-colors">
                <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>
                
                {/* Address Mode Switch */}
                <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => handleModeChange("default")}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        mode === "default" 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      disabled={!defaultAddress}
                    >
                      Use default address
                      {mode === "default" && <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">Default</span>}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleModeChange("saved")}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        mode === "saved" 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      disabled={addresses.length === 0}
                    >
                      Choose another saved address...
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleModeChange("new")}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        mode === "new" 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      Use a new address
                    </button>
                  </div>
                  
                  {mode === "saved" && (
                    <div className="text-sm text-gray-400">
                      <AddressPicker
                        addresses={addresses}
                        currentId={selectedAddressId}
                        onPick={handleAddressPick}
                      />
                    </div>
                  )}
                  
                  {mode !== "new" && (
                    <div className="flex gap-4 text-sm text-gray-400">
                      <button
                        type="button"
                        onClick={() => navigate("/dashboard?tab=addresses")}
                        className="text-blue-400 hover:underline"
                      >
                        Edit in Address Book
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("saved")}
                        className="text-blue-400 hover:underline"
                      >
                        Change address
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="firstName">First Name</Label>
                          <FormControl>
                            <Input
                              id="firstName"
                              placeholder="Enter first name"
                              data-testid="input-firstName"
                              disabled={mode !== "new"}
                              {...field}
                            />
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
                          <Label htmlFor="lastName">Last Name</Label>
                          <FormControl>
                            <Input
                              id="lastName"
                              placeholder="Enter last name"
                              data-testid="input-lastName"
                              disabled={mode !== "new"}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="email">Email</Label>
                          <FormControl>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter email"
                              data-testid="input-email"
                              disabled={mode !== "new"}
                              {...field}
                            />
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
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <FormControl>
                            <Input
                              id="phone"
                              placeholder="(555) 555-5555"
                              data-testid="input-phone"
                              disabled={mode !== "new"}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="street">Street Address</Label>
                        <FormControl>
                          <AddressAutocomplete
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            placeholder="Start typing your address..."
                            data-testid="input-street"
                            disabled={mode !== "new"}
                            onSelectionChange={(selection) => {
                              if (selection) {
                                form.setValue("address2", selection.address2 || "");
                                form.setValue("city", selection.city || "");
                                form.setValue("state", selection.state || "");
                                form.setValue("zipCode", selection.zipCode || "");
                                form.setValue("country", selection.country || "US");
                                form.setValue("geoapify_place_id", selection.geoapify_place_id || "");
                                form.setValue("latitude", selection.latitude || null);
                                form.setValue("longitude", selection.longitude || null);
                                setSelectedQuoteId(null);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address2"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="address2">Apartment, suite, etc. (Optional)</Label>
                        <FormControl>
                          <Input
                            id="address2"
                            placeholder="Apt, suite, unit, etc."
                            data-testid="input-address2"
                            disabled={mode !== "new"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="city">City</Label>
                          <FormControl>
                            <Input
                              id="city"
                              placeholder="Enter city"
                              data-testid="input-city"
                              disabled={mode !== "new"}
                              {...field}
                            />
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
                          <Label htmlFor="state">State</Label>
                          <FormControl>
                            <Input
                              id="state"
                              placeholder="State"
                              data-testid="input-state"
                              disabled={mode !== "new"}
                              {...field}
                            />
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
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <FormControl>
                            <Input
                              id="zipCode"
                              placeholder="12345"
                              data-testid="input-zipCode"
                              disabled={mode !== "new"}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {mode === "new" && (
                    <FormField
                      control={form.control}
                      name="saveToProfile"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              data-testid="checkbox-saveToProfile"
                            />
                          </FormControl>
                          <Label htmlFor="saveToProfile">Save to profile</Label>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="deliveryInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                        <FormControl>
                          <Input
                            id="deliveryInstructions"
                            placeholder="Any special delivery instructions..."
                            data-testid="input-deliveryInstructions"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Shipping Methods */}
              <section className="p-6 rounded-2xl border-2 border-white/15 hover:border-white/25 transition-colors">
                <h2 className="text-xl font-semibold mb-4">Shipping Method</h2>
                {quotesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-black/20">
                        <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-600 rounded w-3/4 mb-1"></div>
                          <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                        </div>
                        <div className="h-4 bg-gray-600 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : !isAddressValid ? (
                  <p className="text-gray-400 text-sm">Complete your address to see shipping options...</p>
                ) : quotes.length === 0 ? (
                  <p className="text-gray-400 text-sm">No shipping options available yet...</p>
                ) : (
                  <div className="space-y-3">
                    {quotes.map((q: any) => (
                      <label key={q.id ?? `${q.service}-${q.price}`} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 cursor-pointer hover:bg-black/30 transition-colors">
                        <input
                          type="radio"
                          checked={selectedQuoteId === (q.id ?? q.service)}
                          onChange={() => setSelectedQuoteId(q.id ?? q.service)}
                          data-testid={`radio-quote-${q.id ?? q.service}`}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{q.label ?? q.service}</div>
                          {q.isLocal && <div className="text-xs text-green-400">Local Delivery (≤50 miles)</div>}
                          <div className="text-xs opacity-80">{q.eta ?? ""}</div>
                        </div>
                        <div className="font-medium">${(q.price / 100).toFixed(2)}</div>
                      </label>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Order Summary */}
            <aside className="md:col-span-1 p-6 rounded-2xl border-2 border-white/15 h-fit">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              {cartItems.length === 0 ? (
                <div className="text-center text-sm opacity-80 py-4">
                  <p>Your cart is empty</p>
                  <p>Add some items from our <a href="/products" className="text-blue-400 hover:underline">shop</a> to continue</p>
                </div>
              ) : (
                <ul className="space-y-2 mb-4">
                  {cartItems.map((line: any) => {
                    const product = line.product;
                    const unitPrice = product?.price ? parseFloat(product.price) * 100 : 0;
                    const quantity = line.qty ?? line.quantity ?? 1;
                    const lineTotal = unitPrice > 0 && quantity > 0 ? unitPrice * quantity : cents(
                      line.total ?? 
                      (line.unit && line.qty ? line.unit * line.qty : 0) ??
                      line.subtotal ??
                      0
                    );
                    const title = line.title ?? line.name ?? product?.name ?? "Item";
                    
                    return (
                      <li key={line.id} className="flex justify-between text-sm">
                        <span>{title} × {quantity}</span>
                        <span>{money(lineTotal)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="flex justify-between text-sm py-2 border-t border-white/10">
                <span>Subtotal</span>
                <span>{money(cartItems.reduce((total: number, line: any) => {
                  const product = line.product;
                  const unitPrice = product?.price ? parseFloat(product.price) * 100 : 0;
                  const quantity = line.qty ?? line.quantity ?? 1;
                  const lineTotal = unitPrice > 0 && quantity > 0 ? unitPrice * quantity : cents(
                    line.total ?? 
                    (line.unit && line.qty ? line.unit * line.qty : 0) ??
                    line.subtotal ??
                    0
                  );
                  return total + lineTotal;
                }, 0))}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span>Shipping</span>
                <span>{selectedQuoteId ? "Calculated at next step" : "—"}</span>
              </div>
              <Button
                className="w-full mt-6 bg-accent-blue hover:bg-blue-500 text-white"
                type="submit"
                disabled={
                  submitCheckout.isPending ||
                  quotesLoading ||
                  cartItems.length === 0 ||
                  !isAddressValid ||
                  !selectedQuoteId
                }
                data-testid="button-continueToPayment"
              >
                {submitCheckout.isPending ? "Processing…" : "Continue to Payment"}
              </Button>
            </aside>
          </form>
        </Form>
      </div>
    </div>
  );
}