import { useState } from 'react';
import { Truck, Clock, Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DeliveryMethodStepProps {
  user: any;
  checkoutData: any;
  setCheckoutData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  shipping: number;
}

export function DeliveryMethodStep({ 
  user, 
  checkoutData, 
  setCheckoutData, 
  onNext, 
  onBack, 
  shipping 
}: DeliveryMethodStepProps) {
  const [selectedMethod, setSelectedMethod] = useState(checkoutData.deliveryMethod || '');
  const [notes, setNotes] = useState(checkoutData.notes || '');
  
  const isLocal = checkoutData.deliveryAddress?.isLocal;
  
  const deliveryMethods = [
    {
      id: 'local_delivery',
      name: 'FREE Local Delivery to Your Doorstep',
      description: 'Free delivery within Asheville area',
      price: 0,
      estimatedDays: '2-3 business days',
      icon: <Truck className="h-6 w-6 text-green-600" />,
      available: isLocal,
      popular: isLocal
    },
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: 'Reliable nationwide delivery',
      price: 9.99,
      estimatedDays: '5-7 business days',
      icon: <Package className="h-6 w-6 text-blue-600" />,
      available: true,
      popular: !isLocal
    },
    {
      id: 'expedited',
      name: 'Expedited Shipping',
      description: 'Faster delivery for urgent orders',
      price: 19.99,
      estimatedDays: '2-3 business days',
      icon: <Clock className="h-6 w-6 text-orange-600" />,
      available: !isLocal, // Not needed for local customers
      popular: false
    }
  ];
  
  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setCheckoutData((prev: any) => ({ 
      ...prev, 
      deliveryMethod: methodId,
      notes
    }));
  };
  
  const handleNotesChange = (value: string) => {
    setNotes(value);
    setCheckoutData((prev: any) => ({ 
      ...prev, 
      notes: value
    }));
  };
  
  const handleContinue = () => {
    if (!selectedMethod) return;
    
    setCheckoutData((prev: any) => ({ 
      ...prev, 
      deliveryMethod: selectedMethod,
      notes
    }));
    onNext();
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-text-primary">Choose Delivery Method</h2>
      
      {/* Local Customer Message */}
      {isLocal && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Great news! You qualify for FREE local delivery
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                As an Asheville area customer, we'll deliver your order to your doorstep at no additional cost.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Delivery Methods */}
      <div className="space-y-4 mb-6">
        {deliveryMethods
          .filter(method => method.available)
          .map((method) => (
            <Card
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={`p-4 cursor-pointer transition-all border-2 ${
                selectedMethod === method.id
                  ? 'border-accent-blue bg-accent-blue/5' 
                  : method.available 
                    ? 'border-border hover:border-accent-blue/50' 
                    : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === method.id
                      ? 'border-accent-blue bg-accent-blue'
                      : 'border-gray-300'
                  }`}>
                    {selectedMethod === method.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {method.icon}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">
                          {method.name}
                        </span>
                        {method.popular && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {method.description} • {method.estimatedDays}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-bold text-lg ${
                    method.price === 0 ? 'text-green-600' : 'text-text-primary'
                  }`}>
                    {method.price === 0 ? 'FREE' : `$${method.price.toFixed(2)}`}
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>
      
      {/* Delivery Notes */}
      <div className="mb-6">
        <Label htmlFor="delivery-notes" className="text-sm font-medium mb-2 block">
          Delivery Instructions (Optional)
        </Label>
        <Textarea
          id="delivery-notes"
          placeholder="Any special instructions for delivery? (e.g., leave at front door, call when arriving, etc.)"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="min-w-32">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedMethod}
          size="lg"
          className="min-w-40"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}