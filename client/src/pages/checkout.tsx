import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Plus, Check } from "lucide-react";
import { useLocality } from "@/hooks/useLocality";
import { LocalBadge } from "@/components/locality/LocalBadge";
import { motion } from "framer-motion";
import { DeliveryEligibilityBanner } from '@/components/fulfillment/DeliveryEligibilityBanner';

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: locality } = useLocality();
  const queryClient = useQueryClient();
  
  // FIXED: Fetch addresses with correct API structure
  const { data: addressesResponse, isLoading: addressLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await fetch('/api/addresses', { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: 60000
  });
  
  // FIXED: Extract addresses from proper response structure
  const addresses = addressesResponse?.data || addressesResponse || [];

  // FIXED: Cart data with proper structure extraction
  const { data: cartResponse, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await fetch('/api/cart', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },
    staleTime: 30000
  });
  
  // FIXED: Extract cart items from proper response structure
  const cart = cartResponse?.data || cartResponse || { items: [], subtotal: 0, total: 0 };

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    firstName: "",
    lastName: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    isDefault: false
  });

  // Auto-select address: DEFAULT first, then FIRST available, then show form
  useEffect(() => {
    if (!addressLoading && addresses.length > 0 && !selectedAddressId) {
      console.log('Checkout: Checking addresses for auto-selection', addresses);
      
      // Priority 1: Find DEFAULT address
      const defaultAddr = addresses.find((addr: any) => addr.isDefault === true);
      if (defaultAddr) {
        console.log('Checkout: Selected default address', defaultAddr.id);
        setSelectedAddressId(defaultAddr.id);
        return;
      }
      
      // Priority 2: Use FIRST address if no default
      if (addresses.length > 0) {
        console.log('Checkout: No default found, selecting first address', addresses[0].id);
        setSelectedAddressId(addresses[0].id);
        return;
      }
    }
    
    // Priority 3: If NO addresses exist, show form
    if (!addressLoading && addresses.length === 0 && !showNewAddressForm) {
      console.log('Checkout: No addresses found, showing new address form');
      setShowNewAddressForm(true);
    }
  }, [addresses, addressLoading, selectedAddressId, showNewAddressForm]);

  // Mutation to create new address
  const createAddressMutation = useMutation({
    mutationFn: async (addressData: any) => {
      return await apiRequest('POST', '/api/addresses', addressData);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setSelectedAddressId(data?.id);
      setShowNewAddressForm(false);
      toast({
        title: "Address saved",
        description: "Your address has been saved successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive"
      });
    }
  });

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !user) {
    window.location.href = '/api/auth/login';
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4">Redirecting to login...</p>
      </div>
    );
  }

  if (addressLoading || cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">Loading checkout...</div>
      </div>
    );
  }

  // Cart data properly structured from new SSOT API
  
  const cartItems = (cart as any)?.items || [];
  const hasItems = cartItems.length > 0;
  // FIXED: Calculate subtotal properly with null/undefined checks
  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const price = parseFloat(item.product?.price || '0') || 0;
    const quantity = parseInt(item.qty || '0') || 0;
    console.log(`[CHECKOUT CALC] Item: ${item.product?.name}, Price: ${price}, Quantity: ${quantity}, Subtotal: ${price * quantity}`);
    return sum + (price * quantity);
  }, 0);
  
  console.log(`[CHECKOUT TOTALS] Cart has ${cartItems.length} items, Subtotal: $${subtotal.toFixed(2)}`);

  const handleSaveNewAddress = () => {
    if (!newAddress.firstName || !newAddress.lastName || !newAddress.street1 || !newAddress.city || !newAddress.state || !newAddress.postalCode) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createAddressMutation.mutate({
      ...newAddress,
      // If this is the first address, make it default
      isDefault: addresses.length === 0 ? true : newAddress.isDefault
    });
  };

  const selectedAddress = addresses.find((addr: any) => addr.id === selectedAddressId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bebas">CHECKOUT</h1>
      </div>

      {/* Locality Banner for Checkout */}
      {locality && (
        <motion.div 
          className="mb-6 flex justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-slate-800/30 to-slate-700/30 border border-slate-600/40 rounded-2xl px-4 py-2 backdrop-blur-sm shadow-lg">
            <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-100">
              {locality.eligible ? (
                "You are in our FREE DELIVERY zone!"
              ) : selectedAddress ? (
                "You're outside our Local Delivery area. Shipping costs will be calculated for your items."
              ) : (
                "Please add your address to determine delivery options and costs."
              )}
            </span>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showNewAddressForm ? (
                <>
                  {/* Existing addresses */}
                  {addresses.length > 0 && (
                    <div className="space-y-3">
                      {addresses.map((address: any) => (
                        <div 
                          key={address.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedAddressId === address.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedAddressId(address.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">
                                {address.firstName} {address.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.street1}
                                {address.street2 && `, ${address.street2}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} {address.postalCode}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {address.isDefault && (
                                  <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                    Default
                                  </span>
                                )}
                                <LocalBadge isLocal={locality?.eligible ?? false} />
                              </div>
                            </div>
                            {selectedAddressId === address.id && (
                              <Check className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button 
                    variant="outline"
                    onClick={() => setShowNewAddressForm(true)}
                    className="w-full flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Address
                  </Button>
                </>
              ) : (
                /* New Address Form */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newAddress.firstName}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newAddress.lastName}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="street1">Street Address *</Label>
                    <Input
                      id="street1"
                      value={newAddress.street1}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, street1: e.target.value }))}
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <Label htmlFor="street2">Apartment, Suite, Unit (Optional)</Label>
                    <Input
                      id="street2"
                      value={newAddress.street2}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, street2: e.target.value }))}
                      placeholder="Apt 2B"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="CA"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">ZIP Code *</Label>
                      <Input
                        id="postalCode"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        placeholder="90210"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isDefault"
                      checked={newAddress.isDefault}
                      onCheckedChange={(checked) => setNewAddress(prev => ({ ...prev, isDefault: !!checked }))}
                    />
                    <Label htmlFor="isDefault">Set as default address</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveNewAddress}
                      disabled={createAddressMutation.isPending}
                      className="flex-1"
                    >
                      {createAddressMutation.isPending ? "Saving..." : "Save Address"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowNewAddressForm(false);
                        // Reset form
                        setNewAddress({
                          firstName: "",
                          lastName: "",
                          street1: "",
                          street2: "",
                          city: "",
                          state: "",
                          postalCode: "",
                          isDefault: false
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Shipping Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Method</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 bg-[#1e232a]">
              {selectedAddress ? (
                <div className="p-4 rounded-lg bg-[#212938]">
                  <p className="text-sm text-gray-600 mb-2">Shipping to:</p>
                  <p className="font-medium">
                    {selectedAddress.street1}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                  </p>
                  
                  {/* Dynamic shipping based on locality and product fulfillment */}
                  {(() => {
                    const isUserLocal = locality?.eligible || false;
                    const hasLocalOnlyItems = cartItems.some((item: any) => 
                      item.product?.is_local_delivery_available && !item.product?.is_shipping_available
                    );
                    const hasShippingItems = cartItems.some((item: any) => 
                      item.product?.is_shipping_available
                    );
                    const hasLocalAndShippingItems = cartItems.some((item: any) => 
                      item.product?.is_local_delivery_available && item.product?.is_shipping_available
                    );

                    // LOCAL USER = Always prioritize LOCAL DELIVERY for LOCAL_AND_SHIPPING items
                    if (isUserLocal) {
                      return (
                        <div className="mt-4 p-3 border rounded bg-green-50 border-green-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-green-800">FREE Local Delivery</p>
                              <p className="text-sm text-green-600">
                                {hasLocalAndShippingItems 
                                  ? "Your items will be delivered locally • Most orders arrive in 24–48 hrs"
                                  : "Most orders arrive in 24–48 hrs"
                                }
                              </p>
                            </div>
                            <p className="font-medium text-green-800">FREE</p>
                          </div>
                        </div>
                      );
                    }
                    
                    // NON-LOCAL USER with LOCAL-ONLY items = BLOCKED
                    if (!isUserLocal && hasLocalOnlyItems && !hasShippingItems) {
                      return (
                        <div className="mt-4 p-3 border rounded bg-red-50 border-red-200">
                          <div className="text-center">
                            <p className="font-medium text-red-800 mb-1">Local Delivery Only Items</p>
                            <p className="text-sm text-red-600">These items are not available for shipping to your area</p>
                          </div>
                        </div>
                      );
                    }
                    
                    // NON-LOCAL USER with SHIPPING-AVAILABLE items (including LOCAL_AND_SHIPPING)
                    if (!isUserLocal && hasShippingItems) {
                      return (
                        <div className="mt-4 p-3 border rounded bg-white">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Standard Shipping</p>
                              <p className="text-sm text-gray-600">
                                {hasLocalAndShippingItems 
                                  ? "Your items will be shipped • 5-7 business days"
                                  : "5-7 business days"
                                }
                              </p>
                            </div>
                            <p className="font-medium">$9.99</p>
                          </div>
                        </div>
                      );
                    }

                    // DEFAULT FALLBACK
                    return (
                      <div className="mt-4 p-3 border rounded bg-white">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Delivery options will be calculated based on your items</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Select address to see delivery options
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasItems ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Your cart is empty</p>
                  <Button onClick={() => window.location.href = "/products"}>
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <>
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <Link href={`/products/${item.productId}`}>
                          <div className="font-medium cursor-pointer hover:text-blue-600 transition-colors">
                            {item.product?.name}
                          </div>
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          Qty: {item.qty}
                          {item.product?.stockQuantity && item.product.stockQuantity > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              (Stock: {item.product.stockQuantity})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-semibold">
                        ${(Number(item.product?.price || 0) * (item.qty || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={!hasItems}
                    data-testid="button-continue-payment"
                  >
                    Continue to Payment
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}