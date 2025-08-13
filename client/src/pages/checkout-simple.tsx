import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAddresses } from "@/hooks/use-addresses";
import { CheckoutSkeleton } from "@/components/ui/checkout-skeleton";
import { AddressBlock } from "@/components/checkout/AddressBlock";
import { useQuery } from "@tanstack/react-query";

export default function CheckoutSimple() {
  const { addresses, defaultAddress, isLoading: addressLoading } = useAddresses();
  
  const { data: cartResp, isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
    staleTime: 30_000,
  });

  if (addressLoading || cartLoading) {
    return <CheckoutSkeleton />;
  }

  const cartItems = (cartResp as any)?.items || [];
  const hasItems = cartItems.length > 0;
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum: number, item: any) => {
    return sum + (Number(item.product?.price || 0) * (item.quantity || 0));
  }, 0);

  const handleAddressResolved = (addr: { addressId?: string; addressObj?: any }) => {
    console.log("Address resolved:", addr);
    // TODO: Fetch shipping quotes based on address
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <AddressBlock
            addresses={addresses}
            defaultAddress={defaultAddress}
            initialMode={defaultAddress ? "default" : "new"}
            onAddressResolved={handleAddressResolved}
          />
          
          {/* Shipping Methods Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 text-center text-muted-foreground">
                Select address to see shipping options
              </div>
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