import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MapPin, Plus, Check } from "lucide-react";

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Fetch user's addresses - NORMALIZED API RESPONSE
  const { data: addressesRaw = [], isLoading: addressLoading } = useQuery({
    queryKey: ['addresses'],
    enabled: isAuthenticated,
    staleTime: 60000
  });
  
  // API SHAPE FIX: Server now returns plain array consistently  
  const addresses = Array.isArray(addressesRaw) ? addressesRaw : [];

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    enabled: isAuthenticated,
    staleTime: 30000
  });

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

  // Auto-select default address if available
  useEffect(() => {
    if (!addressLoading && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((addr: any) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else {
        // If no default, show new address form
        setShowNewAddressForm(true);
      }
    }
  }, [addresses, addressLoading, selectedAddressId]);

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

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Please sign in to continue with checkout</p>
        <Button onClick={() => window.location.href = '/api/auth/login'} className="mt-4">
          Sign In
        </Button>
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

  const cartItems = (cart as any)?.items || [];
  const hasItems = cartItems.length > 0;
  const subtotal = cartItems.reduce((sum: number, item: any) => {
    return sum + (Number(item.product?.price || 0) * (item.quantity || 0));
  }, 0);

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
                                {address.streetAddress}
                                {address.apartment && `, ${address.apartment}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} {address.zipCode}
                              </p>
                              {address.isDefault && (
                                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded mt-1">
                                  Default
                                </span>
                              )}
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
            <CardContent>
              {selectedAddress ? (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Shipping to:</p>
                  <p className="font-medium">
                    {selectedAddress.street1}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                  </p>
                  <div className="mt-4 p-3 border rounded bg-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Standard Shipping</p>
                        <p className="text-sm text-gray-600">5-7 business days</p>
                      </div>
                      <p className="font-medium">$9.99</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Select address to see shipping options
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
                        <div className="font-medium">{item.product?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="font-semibold">
                        ${(Number(item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}
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