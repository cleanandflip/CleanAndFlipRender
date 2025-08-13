/**
 * SSOT Address Management Page - Phase 4: Page Integration
 * Unified address management interface with proper UX flow
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MapPin } from 'lucide-react';
import { AddressForm } from '@/components/addresses/AddressForm';
import { AddressList } from '@/components/addresses/AddressList';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';

export function AddressesPage() {
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const handleAddressAdded = () => {
    setIsAddingAddress(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
          <p className="text-gray-600 mt-2">
            Manage your shipping addresses. Local addresses qualify for free delivery.
          </p>
        </div>
        <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" data-testid="button-add-address">
              <Plus className="w-4 h-4" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <AddressForm
              onSuccess={handleAddressAdded}
              onCancel={() => setIsAddingAddress(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Address List */}
      <div>
        <AddressList />
      </div>

      {/* Local Delivery Info */}
      <Card className="mt-8 bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <MapPin className="w-5 h-5" />
            Free Local Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">
            Addresses within our 50km delivery zone automatically qualify for free local delivery. 
            We'll calculate this automatically when you add your address.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}