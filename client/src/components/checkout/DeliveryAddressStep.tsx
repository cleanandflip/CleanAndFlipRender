import { useState, useEffect } from 'react';
import { Check, Plus, Home, Edit2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { useToast } from '@/hooks/use-toast';

interface SavedAddress {
  id: string;
  label: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  isLocal?: boolean;
}

interface DeliveryAddressStepProps {
  user: any;
  checkoutData: any;
  setCheckoutData: (data: any) => void;
  onNext: () => void;
}

export function DeliveryAddressStep({ user, checkoutData, setCheckoutData, onNext }: DeliveryAddressStepProps) {
  const { toast } = useToast();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: ''
  });
  
  // Check if ZIP is in Asheville area
  const isAshevilleZip = (zip: string) => {
    return zip.startsWith('287') || zip.startsWith('288');
  };
  
  // Load saved addresses
  useEffect(() => {
    if (user?.street && user?.city) {
      const primaryAddress: SavedAddress = {
        id: 'primary',
        label: 'Home Address',
        street: user.street,
        apartment: user.apartment || '',
        city: user.city,
        state: user.state || 'NC',
        zipCode: user.zipCode || '',
        isDefault: true,
        isLocal: user.isLocalCustomer
      };
      
      setSavedAddresses([primaryAddress]);
      setSelectedAddressId('primary');
      setCheckoutData((prev: any) => ({ ...prev, deliveryAddress: primaryAddress }));
    } else {
      setShowNewAddress(true);
    }
  }, [user]);
  
  const handleAddressSelect = (addressId: string) => {
    const address = savedAddresses.find(a => a.id === addressId);
    setSelectedAddressId(addressId);
    setCheckoutData((prev: any) => ({ ...prev, deliveryAddress: address }));
  };
  
  const handleAddressSubmit = async (addressData: any) => {
    const isLocal = isAshevilleZip(addressData.zipCode);
    
    const address: SavedAddress = {
      id: `new-${Date.now()}`,
      label: 'Delivery Address',
      street: addressData.street,
      apartment: addressData.apartment || '',
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode,
      isDefault: false,
      isLocal
    };
    
    setSavedAddresses([...savedAddresses, address]);
    setSelectedAddressId(address.id);
    setCheckoutData((prev: any) => ({ ...prev, deliveryAddress: address }));
    setShowNewAddress(false);
    
    toast({
      title: isLocal ? "Great news!" : "Address saved",
      description: isLocal 
        ? "You qualify for FREE local delivery to your doorstep!" 
        : "Standard shipping rates will apply to this address.",
    });
  };
  
  const canProceed = selectedAddressId && checkoutData.deliveryAddress;
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-text-primary">Select Delivery Address</h2>
      
      {/* Saved Addresses */}
      <div className="space-y-3 mb-6">
        {savedAddresses.map((address) => (
          <Card
            key={address.id}
            onClick={() => handleAddressSelect(address.id)}
            className={`p-4 cursor-pointer transition-all border-2 ${
              selectedAddressId === address.id 
                ? 'border-accent-blue bg-accent-blue/5' 
                : 'border-border hover:border-accent-blue/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedAddressId === address.id 
                    ? 'border-accent-blue bg-accent-blue' 
                    : 'border-gray-300'
                }`}>
                  {selectedAddressId === address.id && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-text-primary">{address.label}</span>
                    {address.isDefault && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                    {address.isLocal && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        FREE Delivery
                      </span>
                    )}
                  </div>
                  
                  <div className="text-text-secondary">
                    <p>{address.street}</p>
                    {address.apartment && <p>Apt {address.apartment}</p>}
                    <p>{address.city}, {address.state} {address.zipCode}</p>
                  </div>
                  
                  {address.isLocal && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Qualifies for free local delivery to your doorstep
                    </p>
                  )}
                </div>
              </div>
              
              <Button variant="ghost" size="sm" className="text-gray-400">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Add New Address */}
      {!showNewAddress ? (
        <Button 
          variant="outline" 
          onClick={() => setShowNewAddress(true)}
          className="w-full mb-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
      ) : (
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">Add New Delivery Address</h3>
          <AddressAutocomplete
            onAddressSubmit={handleAddressSubmit}
            isLoading={false}
            initialAddress={newAddress}
            theme="navy"
          />
          <Button
            variant="ghost"
            onClick={() => setShowNewAddress(false)}
            className="mt-4"
          >
            Cancel
          </Button>
        </Card>
      )}
      
      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className="min-w-40"
        >
          Continue to Delivery Method
        </Button>
      </div>
    </div>
  );
}