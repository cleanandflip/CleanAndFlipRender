import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Edit } from "lucide-react";
import { useLocation } from "wouter";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type Mode = "default" | "saved" | "new";

type AddressDTO = {
  id: string;
  firstName: string;
  lastName: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  is_default?: boolean;
  is_local?: boolean;
  latitude?: number;
  longitude?: number;
  geoapify_place_id?: string;
};

const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  street: z.string().min(1, "Street address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  country: z.string().default("US"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  geoapify_place_id: z.string().optional(),
  saveToProfile: z.boolean().default(false),
});

function ModeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={active ? "bg-primary text-primary-foreground" : ""}
    >
      {children}
    </Button>
  );
}

function LockedAddressCard({ 
  address, 
  onChange, 
  onEditAddressBook 
}: { 
  address?: AddressDTO; 
  onChange: () => void; 
  onEditAddressBook: () => void; 
}) {
  if (!address) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          No address selected
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 mt-1 text-muted-foreground" />
            <div>
              <div className="font-medium">{address.firstName} {address.lastName}</div>
              <div className="text-sm text-muted-foreground">
                {address.street1}
                {address.street2 && <div>{address.street2}</div>}
                <div>{address.city}, {address.state} {address.postalCode}</div>
                <div>{address.country}</div>
              </div>
              {address.is_default && (
                <Badge variant="secondary" className="mt-1">Default</Badge>
              )}
              {address.is_local && (
                <Badge variant="outline" className="mt-1 ml-2">Local Delivery</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onChange}>
              <Edit className="h-4 w-4 mr-1" />
              Change
            </Button>
            <Button variant="outline" size="sm" onClick={onEditAddressBook}>
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditableAddressForm({ 
  onValidAddress,
  initialData
}: { 
  onValidAddress: (addrObj: any) => void;
  initialData?: Partial<any>;
}) {
  const form = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: initialData?.firstName ?? "",
      lastName: initialData?.lastName ?? "",
      street: "",
      address2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
      saveToProfile: false,
      ...initialData,
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    const { firstName, lastName, street, city, state, zipCode } = watchedValues;
    if (firstName && lastName && street && city && state && zipCode) {
      onValidAddress(watchedValues);
    }
  }, [watchedValues, onValidAddress]);

  return (
    <Card>
      <CardContent className="p-4">
        <Form {...form}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-firstName" />
                  </FormControl>
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
                    <Input {...field} data-testid="input-lastName" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <AddressAutocomplete
                    value={field.value}
                    onSelectionChange={(selection) => {
                      if (selection) {
                        form.setValue("street", selection.street || "");
                        form.setValue("city", selection.city || "");
                        form.setValue("state", selection.state || "");
                        form.setValue("zipCode", selection.zipCode || "");
                        form.setValue("latitude", selection.latitude);
                        form.setValue("longitude", selection.longitude);
                        form.setValue("geoapify_place_id", selection.geoapify_place_id || "");
                      }
                    }}
                    placeholder="Start typing your address..."
                    data-testid="input-address"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address2"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Apartment, suite, etc. (optional)</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-address2" />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4 mt-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-city" />
                  </FormControl>
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
                    <Input {...field} data-testid="input-state" />
                  </FormControl>
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
                    <Input {...field} data-testid="input-zipCode" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="saveToProfile"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-saveToProfile"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Save this address to my profile</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </Form>
      </CardContent>
    </Card>
  );
}

export function AddressBlock({
  addresses,
  defaultAddress,
  initialMode,
  onAddressResolved
}: {
  addresses: AddressDTO[];
  defaultAddress?: AddressDTO;
  initialMode: Mode;
  onAddressResolved: (addr: { addressId?: string; addressObj?: any }) => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [selectedId, setSelectedId] = useState<string | undefined>(defaultAddress?.id);
  const [, setLocation] = useLocation();

  // When mode or selection changes, inform parent for shipping quotes
  useEffect(() => {
    if (mode === "new") return; // parent will pass addressObj from the form
    const addr = addresses.find(a => a.id === (selectedId ?? defaultAddress?.id));
    if (addr) onAddressResolved({ addressId: addr.id });
  }, [mode, selectedId, defaultAddress?.id, addresses, onAddressResolved]);

  const openAddressPicker = () => {
    // Simple implementation - could be enhanced with modal
    setMode("saved");
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === "default") {
      setSelectedId(defaultAddress?.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Address</CardTitle>
      </CardHeader>
      <CardContent>
        <section className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <ModeChip 
              active={mode === "default"} 
              onClick={() => handleModeChange("default")}
            >
              Use default
            </ModeChip>
            <ModeChip 
              active={mode === "saved"} 
              onClick={() => handleModeChange("saved")}
            >
              Choose saved…
            </ModeChip>
            <ModeChip 
              active={mode === "new"} 
              onClick={() => handleModeChange("new")}
            >
              Use new address
            </ModeChip>
          </div>

          {mode !== "new" ? (
            <LockedAddressCard
              address={addresses.find(a => a.id === (selectedId ?? defaultAddress?.id))}
              onChange={openAddressPicker}
              onEditAddressBook={() => setLocation("/dashboard?tab=addresses")}
            />
          ) : (
            <EditableAddressForm
              onValidAddress={(addrObj) => onAddressResolved({ addressObj: addrObj })}
            />
          )}
        </section>
      </CardContent>
    </Card>
  );
}