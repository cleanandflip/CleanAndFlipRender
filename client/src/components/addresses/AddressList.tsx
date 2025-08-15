/**
 * SSOT Address List Component
 * Displays user addresses with proper management controls and local delivery indicators
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Star, Trash2, Truck, Home } from 'lucide-react';
import { addressApi, addressQueryKeys, addressUtils, type Address } from '@/api/addresses';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

import { LocalBadge } from '@/components/locality/LocalBadge';
import { isLocalZip } from '@shared/locality';

interface AddressListProps {
  onAddressSelect?: (address: Address) => void;
  selectable?: boolean;
  selectedAddressId?: string;
}

export function AddressList({ 
  onAddressSelect, 
  selectable = false, 
  selectedAddressId 
}: AddressListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  // Each address should show its own locality status, not the global default

  // Fetch addresses
  const { data: addresses, isLoading, error } = useQuery({
    queryKey: addressQueryKeys.lists(),
    queryFn: () => addressApi.getAddresses(),
  });

  // Set default address mutation
  const setDefaultMutation = useMutation({
    mutationFn: (addressId: string) => addressApi.setDefaultAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressQueryKeys.lists() });
      toast({
        title: "Default address updated",
        description: "Your default address has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set default address",
        variant: "destructive"
      });
    }
  });

  // Delete address mutation
  const deleteMutation = useMutation({
    mutationFn: (addressId: string) => addressApi.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressQueryKeys.lists() });
      toast({
        title: "Address deleted",
        description: "Your address has been deleted successfully."
      });
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive"
      });
      setDeletingId(null);
    }
  });

  const handleSetDefault = (addressId: string) => {
    setDefaultMutation.mutate(addressId);
  };

  const handleDelete = (addressId: string) => {
    setDeletingId(addressId);
    deleteMutation.mutate(addressId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load addresses. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!addresses || addresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No addresses found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          You haven't added any addresses yet. Add your first address to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <Card 
          key={address.id}
          className={`transition-all duration-200 hover:shadow-md ${
            selectable && selectedAddressId === address.id 
              ? 'ring-2 ring-blue-500' 
              : ''
          } ${
            selectable 
              ? 'cursor-pointer' 
              : ''
          }`}
          onClick={() => selectable && onAddressSelect?.(address)}
          data-testid={`address-card-${address.id}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Home className="w-4 h-4" />
                {addressUtils.formatFullName(address)}
              </CardTitle>
              <div className="flex items-center gap-2">
                {address.isDefault && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Default
                  </Badge>
                )}
                <LocalBadge isLocal={isLocalZip(address.postalCode)} />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {addressUtils.formatAddressLine(address)}
              </p>
              
              {!selectable && (
                <div className="flex items-center gap-2 pt-2">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      disabled={setDefaultMutation.isPending}
                      data-testid={`button-setDefault-${address.id}`}
                    >
                      {setDefaultMutation.isPending ? 'Setting...' : 'Set as Default'}
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-${address.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Address</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this address? This action cannot be undone.
                          {address.isDefault && (
                            <p className="mt-2 text-amber-600 font-medium">
                              This is your default address. Another address will be automatically set as default if available.
                            </p>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(address.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deletingId === address.id}
                        >
                          {deletingId === address.id ? 'Deleting...' : 'Delete Address'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              
              {selectable && selectedAddressId === address.id && (
                <div className="mt-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    Selected
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}