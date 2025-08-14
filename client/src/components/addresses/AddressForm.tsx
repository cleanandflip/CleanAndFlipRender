/**
 * SSOT Address Form Component
 * Unified address form with proper validation, autocomplete, and local delivery detection
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPin, Truck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { addressApi, addressQueryKeys, addressUtils, type CreateAddressRequest } from '@/api/addresses';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { toast } from '@/hooks/use-toast';

// Validation schema
const addressFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters"),
  postalCode: z.string().min(5, "Postal code must be at least 5 digits"),
  country: z.string().default("US"),
  setDefault: z.boolean().default(false)
});

type AddressFormData = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<AddressFormData>;
  showSetDefault?: boolean;
}

export function AddressForm({ 
  onSuccess, 
  onCancel, 
  defaultValues,
  showSetDefault = true 
}: AddressFormProps) {
  const [selectedGeoapify, setSelectedGeoapify] = useState<any>(null);
  const queryClient = useQueryClient();

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      setDefault: false,
      ...defaultValues
    }
  });

  const createAddressMutation = useMutation({
    mutationFn: (data: CreateAddressRequest) => addressApi.createAddress(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: addressQueryKeys.lists() });
      
      // Dispatch events to trigger locality updates immediately
      window.dispatchEvent(new CustomEvent('addressUpdated', { detail: data }));
      if (form.getValues('setDefault')) {
        window.dispatchEvent(new CustomEvent('defaultAddressChanged', { detail: data }));
      }
      
      toast({
        title: "Address saved",
        description: "Your address has been saved successfully."
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Address creation error:', error);
      
      // Handle validation errors
      if (error.message.includes('400') && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof AddressFormData, {
            type: 'manual',
            message: message as string
          });
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save address. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  const onSubmit = (data: AddressFormData) => {
    const normalizedData = addressUtils.normalizeAddress(data);
    
    const addressRequest: CreateAddressRequest = {
      ...normalizedData,
      latitude: selectedGeoapify?.geometry?.coordinates?.[1],
      longitude: selectedGeoapify?.geometry?.coordinates?.[0],
      geoapifyPlaceId: selectedGeoapify?.properties?.place_id,
    };

    createAddressMutation.mutate(addressRequest);
  };

  // Handle address selection from autocomplete
  const handleAddressSelect = (addressData: any) => {
    // Store for locality detection (create a mock geoapify object for compatibility)
    setSelectedGeoapify({
      properties: {
        distance_km: 0 // Will be calculated by backend
      }
    });
    
    // Map the AddressData fields to form fields
    if (addressData) {
      form.setValue('street1', addressData.street1 || '', { shouldValidate: true, shouldDirty: true });
      form.setValue('street2', addressData.street2 || '');
      form.setValue('city', addressData.city || '', { shouldValidate: true });
      form.setValue('state', addressData.state || '', { shouldValidate: true });
      form.setValue('postalCode', addressData.postalCode || addressData.zipCode || '', { shouldValidate: true });
      form.setValue('country', addressData.country || 'US');
      
      // Trigger validation on all mapped fields
      form.trigger(['street1', 'city', 'state', 'postalCode']);
    }
  };

  const isLocalDelivery = selectedGeoapify && selectedGeoapify.properties?.distance_km <= 50;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Add New Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...form.register('firstName')}
                data-testid="input-firstName"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...form.register('lastName')}
                data-testid="input-lastName"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Address Fields with Autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="street1">Street Address *</Label>
            <AddressAutocomplete
              onAddressSelect={handleAddressSelect}
              value={form.watch('street1')}
              placeholder="Start typing your address..."
              onChange={(value) => form.setValue('street1', value, { shouldValidate: true, shouldDirty: true })}
            />
            {isLocalDelivery && (
              <Alert>
                <Truck className="h-4 w-4" />
                <AlertDescription>
                  🎉 Great! This address qualifies for free local delivery.
                </AlertDescription>
              </Alert>
            )}
            {form.formState.errors.street1 && (
              <p className="text-sm text-red-600">
                {form.formState.errors.street1.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="street2">Apartment, Suite, Unit (Optional)</Label>
            <Input
              id="street2"
              {...form.register('street2')}
              placeholder="Apt 2B"
              data-testid="input-street2"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...form.register('city')}
                data-testid="input-city"
              />
              {form.formState.errors.city && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.city.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                {...form.register('state')}
                placeholder="CA"
                maxLength={2}
                data-testid="input-state"
                style={{ textTransform: 'uppercase' }}
              />
              {form.formState.errors.state && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.state.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">ZIP Code *</Label>
              <Input
                id="postalCode"
                {...form.register('postalCode')}
                placeholder="90210"
                data-testid="input-postalCode"
              />
              {form.formState.errors.postalCode && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.postalCode.message}
                </p>
              )}
            </div>
          </div>

          {/* Set as Default */}
          {showSetDefault && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="setDefault"
                checked={form.watch('setDefault')}
                onCheckedChange={(checked) => form.setValue('setDefault', !!checked)}
                data-testid="checkbox-setDefault"
              />
              <Label htmlFor="setDefault">Set as default address</Label>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={createAddressMutation.isPending}
              data-testid="button-save"
            >
              {createAddressMutation.isPending ? 'Saving...' : 'Save Address'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default AddressForm;