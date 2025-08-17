import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddressForm } from "@/components/addresses/AddressForm";
import { Badge } from "@/components/ui/badge";

interface Address {
  id: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface AddressBlockProps {
  addresses: Address[];
  defaultAddress?: Address | null;
  initialMode?: "default" | "new" | "select";
  onAddressResolved: (result: { addressId?: string; addressObj?: any }) => void;
}

export function AddressBlock({ 
  addresses = [], 
  defaultAddress, 
  initialMode = "default",
  onAddressResolved 
}: AddressBlockProps) {
  const [mode, setMode] = useState(initialMode);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    defaultAddress?.id || null
  );

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Address</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "default" && defaultAddress && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{defaultAddress.fullName}</h4>
              <Badge variant="secondary">Default</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {defaultAddress.street}<br />
              {defaultAddress.city}, {defaultAddress.state} {defaultAddress.zipCode}
            </p>
            <div className="flex gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setMode("select")}
              >
                Change Address
              </Button>
              <Button 
                size="sm"
                onClick={() => onAddressResolved({ addressId: defaultAddress.id })}
              >
                Use This Address
              </Button>
            </div>
          </div>
        )}

        {mode === "select" && addresses.length > 0 && (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div 
                key={addr.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedAddressId(addr.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm">{addr.fullName}</h4>
                  {addr.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                </p>
              </div>
            ))}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setMode("new")}
              >
                Add New Address
              </Button>
              <Button 
                size="sm"
                disabled={!selectedAddress}
                onClick={() => selectedAddress && onAddressResolved({ addressId: selectedAddress.id })}
              >
                Use Selected Address
              </Button>
            </div>
          </div>
        )}

        {mode === "new" && (
          <div className="space-y-4">
            <AddressForm
              onSuccess={() => {
                onAddressResolved({});
                setMode("default");
              }}
              onCancel={() => {
                if (defaultAddress || addresses.length > 0) {
                  setMode(defaultAddress ? "default" : "select");
                } else {
                  // Stay on new mode if no addresses exist
                }
              }}
              submitText="Use This Address"
            />
          </div>
        )}

        {mode === "default" && !defaultAddress && addresses.length === 0 && (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No delivery address on file</p>
            <Button onClick={() => setMode("new")}>Add Delivery Address</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}