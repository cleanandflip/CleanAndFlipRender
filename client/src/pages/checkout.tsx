// client/src/pages/checkout.tsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJSON, postJSON, patchJSON } from "@/lib/utils";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/ui/page-loader";
import { useAuth } from "@/hooks/use-auth";

const asArray = <T,>(x: T[] | null | undefined): T[] => Array.isArray(x) ? x : [];

const addressSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(), // server validates with libphonenumber-js
  street: z.string().min(3, "Required"),
  address2: z.string().optional(),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  zipCode: z.string().min(5, "Required"),
  country: z.string().min(2, "Required").default("US"),
  geoapify_place_id: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  saveToProfile: z.boolean().default(false),
  deliveryInstructions: z.string().max(500).optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function Checkout() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [usingSavedAddressId, setUsingSavedAddressId] = useState<string | null>(null);

  // Auth gate
  const { user, isLoading: userLoading } = useAuth();

  useEffect(() => {
    if (!userLoading && !user?.id) {
      navigate("/auth?redirect=/checkout");
    }
  }, [userLoading, user, navigate]);

  const { data: addressesResp, isLoading: addrLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => fetchJSON("/api/addresses"),
    enabled: !!user?.id,
  });

  const { data: cartResp, isLoading: cartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetchJSON("/api/cart"),
    enabled: !!user?.id,
  });

  const addresses = asArray(addressesResp?.addresses ?? addressesResp);
  const cartItems = asArray(cartResp?.items);

  const defaultAddr =
    addresses.find((a: any) => a.is_default) ??
    null;

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      street: "",
      address2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
      saveToProfile: true,
      deliveryInstructions: "",
    },
    mode: "onChange",
  });

  // Prefill from default/profile address once data is ready
  useEffect(() => {
    if (!userLoading && !addrLoading && defaultAddr) {
      form.reset({
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        street: defaultAddr.street1 ?? defaultAddr.street ?? "",
        address2: defaultAddr.street2 ?? defaultAddr.address2 ?? "",
        city: defaultAddr.city ?? "",
        state: defaultAddr.state ?? "",
        zipCode: defaultAddr.postalCode ?? defaultAddr.zipCode ?? "",
        country: defaultAddr.country ?? "US",
        geoapify_place_id: defaultAddr.geoapify_place_id ?? "",
        latitude: defaultAddr.latitude ?? null,
        longitude: defaultAddr.longitude ?? null,
        saveToProfile: false,
        deliveryInstructions: "",
      });
      setUsingSavedAddressId(defaultAddr.id);
    }
  }, [userLoading, addrLoading, defaultAddr, user, form]);

  // Shipping quotes query (re-run when address changes)
  const addrWatch = form.watch(["street", "city", "state", "zipCode", "country"]);
  const { data: quotesResp, isFetching: quotesLoading, refetch: refetchQuotes } = useQuery({
    queryKey: ["shipping:quotes", addrWatch],
    queryFn: async () => {
      const f = form.getValues();
      return postJSON("/api/shipping/quote", {
        addressId: usingSavedAddressId ?? undefined,
        address: usingSavedAddressId ? undefined : {
          firstName: f.firstName,
          lastName: f.lastName,
          street: f.street,
          address2: f.address2,
          city: f.city,
          state: f.state,
          zipCode: f.zipCode,
          country: f.country,
          latitude: f.latitude,
          longitude: f.longitude,
          geoapify_place_id: f.geoapify_place_id,
        }
      });
    },
    enabled: !!user?.id && cartItems.length > 0,
    staleTime: 0,
  });
  const quotes = asArray((quotesResp as any)?.quotes ?? []);

  // Change saved address → make it default on server → repopulate
  const mutateDefault = useMutation({
    mutationFn: (id: string) => patchJSON(`/api/addresses/${id}/default`, {}),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["addresses"] }),
        qc.invalidateQueries({ queryKey: ["user"] }),
        qc.invalidateQueries({ queryKey: ["cart"] }),
      ]);
      setSelectedQuoteId(null);
      toast({ title: "Address updated", description: "Using your default address." });
    },
    onError: () => toast({ title: "Couldn't switch address", variant: "destructive" })
  });

  // Submit checkout
  const submitCheckout = useMutation({
    mutationFn: async (payload: any) => postJSON("/api/checkout/submit", payload),
    onSuccess: ({ url }: any) => {
      window.location.href = url;
    },
    onError: () => toast({ title: "Checkout failed", variant: "destructive" }),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    // Persist address if asked or if none saved
    let shippingAddressId = usingSavedAddressId;

    if (!shippingAddressId || values.saveToProfile) {
      const created = await postJSON("/api/addresses", {
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
        is_default: !usingSavedAddressId, // first time, make default
      });
      shippingAddressId = (created as any)?.id || (created as any)?.address?.id || null;
      setUsingSavedAddressId(shippingAddressId ?? null);
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

  // Helpers
  const fillFromGeoapify = (p: any) => {
    form.setValue("street", [p.housenumber, p.street].filter(Boolean).join(" "));
    form.setValue("address2", p.unit ?? "");
    form.setValue("city", p.city || p.town || p.village || "");
    form.setValue("state", (p.state_code || p.state || "").toString());
    form.setValue("zipCode", p.postcode || "");
    form.setValue("country", (p.country_code || "US").toUpperCase());
    form.setValue("geoapify_place_id", p.place_id || "");
    form.setValue("latitude", p.lat ?? p.latLng?.lat ?? null);
    form.setValue("longitude", p.lon ?? p.latLng?.lng ?? null);
    setUsingSavedAddressId(null); // now using a fresh unsaved address
    setSelectedQuoteId(null);
    refetchQuotes();
  };

  return (
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Contact + Shipping form */}
        <form className="grid grid-cols-1 md:grid-cols-3 gap-8" onSubmit={onSubmit}>
          <div className="md:col-span-2 space-y-6">
            <section className="p-6 rounded-2xl border-2 border-white/15 hover:border-white/25 transition-colors">
              <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="block mb-1 text-sm font-medium">First Name</Label>
                  <Input {...form.register("firstName")} data-testid="input-firstName" />
                  {form.formState.errors.firstName && (
                    <p className="mt-1 text-sm text-red-400">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="block mb-1 text-sm font-medium">Last Name</Label>
                  <Input {...form.register("lastName")} data-testid="input-lastName" />
                  {form.formState.errors.lastName && (
                    <p className="mt-1 text-sm text-red-400">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email" className="block mb-1 text-sm font-medium">Email</Label>
                  <Input type="email" {...form.register("email")} data-testid="input-email" />
                  {form.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-400">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone" className="block mb-1 text-sm font-medium">Phone (Optional)</Label>
                  <Input {...form.register("phone")} placeholder="(555) 555-5555" data-testid="input-phone" />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="street" className="block mb-1 text-sm font-medium">Street Address</Label>
                  <AddressAutocomplete
                    placeholder="Start typing your address…"
                    value={form.watch("street")}
                    onAddressSelect={(addressData: any) => {
                      const properties = addressData.properties || addressData;
                      fillFromGeoapify(properties);
                    }}
                    className="w-full"
                  />
                  {form.formState.errors.street && (
                    <p className="mt-1 text-sm text-red-400">{form.formState.errors.street.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address2" className="block mb-1 text-sm font-medium">Apartment, suite, etc. (Optional)</Label>
                  <Input {...form.register("address2")} data-testid="input-address2" />
                </div>

                <div>
                  <Label htmlFor="city" className="block mb-1 text-sm font-medium">City</Label>
                  <Input {...form.register("city")} data-testid="input-city" />
                  {form.formState.errors.city && (
                    <p className="mt-1 text-sm text-red-400">{form.formState.errors.city.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="state" className="block mb-1 text-sm font-medium">State</Label>
                  <Input {...form.register("state")} data-testid="input-state" />
                  {form.formState.errors.state && (
                    <p className="mt-1 text-sm text-red-400">{form.formState.errors.state.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="zipCode" className="block mb-1 text-sm font-medium">ZIP Code</Label>
                  <Input {...form.register("zipCode")} data-testid="input-zipCode" />
                  {form.formState.errors.zipCode && (
                    <p className="mt-1 text-sm text-red-400">{form.formState.errors.zipCode.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="deliveryInstructions" className="block mb-1 text-sm font-medium">Delivery Instructions (Optional)</Label>
                  <Input {...form.register("deliveryInstructions")} data-testid="input-deliveryInstructions" />
                </div>

                <div className="md:col-span-2 flex items-center gap-3">
                  <input id="saveToProfile" type="checkbox" {...form.register("saveToProfile")} data-testid="checkbox-saveToProfile" />
                  <Label htmlFor="saveToProfile">Save this address to my profile</Label>

                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm opacity-80">
                      Using: {usingSavedAddressId ? "Saved address" : "Unsaved address"}
                    </span>
                    {addresses.length > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const other = addresses.find((a: any) => a.id !== usingSavedAddressId) ?? addresses[0];
                          if (other?.id) {
                            setUsingSavedAddressId(other.id);
                            mutateDefault.mutate(other.id);
                          }
                        }}
                        data-testid="button-changeSavedAddress"
                      >
                        Change saved address
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping methods */}
            <section className="p-6 rounded-2xl border-2 border-white/15 hover:border-white/25 transition-colors">
              <h2 className="text-xl font-semibold mb-6">Shipping Method</h2>
              {quotesLoading ? (
                <div className="text-sm opacity-80">Getting options…</div>
              ) : quotes.length === 0 ? (
                <div className="text-sm opacity-80">
                  No options yet. Make sure your address is complete. Local delivery shown if within 50 miles.
                </div>
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
                        <div className="text-xs opacity-80">{q.eta ?? ""}</div>
                      </div>
                      <div className="font-medium">${(q.price / 100).toFixed(2)}</div>
                    </label>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Order summary */}
          <aside className="md:col-span-1 p-6 rounded-2xl border-2 border-white/15 h-fit">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            <ul className="space-y-2 mb-4">
              {cartItems.map((line: any) => (
                <li key={line.id} className="flex justify-between text-sm">
                  <span>{line.name ?? line.title} × {line.quantity ?? line.qty}</span>
                  <span>${((line.price * line.quantity) || (line.total / 100) || 0).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-sm py-2 border-t border-white/15">
              <span>Subtotal</span>
              <span>${((cartResp?.subtotal ?? cartResp?.total ?? 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span>Shipping</span>
              <span>{selectedQuoteId ? "Calculated" : "—"}</span>
            </div>
            <Button
              className="w-full mt-6 bg-accent-blue hover:bg-blue-500 text-white"
              type="submit"
              disabled={
                submitCheckout.isPending ||
                quotesLoading ||
                cartItems.length === 0 ||
                !form.formState.isValid ||
                !selectedQuoteId
              }
              data-testid="button-continueToPayment"
            >
              {submitCheckout.isPending ? "Processing…" : "Continue to Payment"}
            </Button>
          </aside>
        </form>
      </div>
    </div>
  );
}