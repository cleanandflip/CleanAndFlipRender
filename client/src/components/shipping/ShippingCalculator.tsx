import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Dropdown from "@/components/ui/Dropdown";
import { Card } from "@/components/shared/AnimatedComponents";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Truck, Package, Clock, DollarSign, MapPin } from "lucide-react";

interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  carrier: string;
  service: string;
}

interface ShippingCalculatorProps {
  cartTotal: number;
  cartWeight?: number;
  onShippingSelected: (option: ShippingOption) => void;
  selectedOption?: ShippingOption | null;
  className?: string;
}

export function ShippingCalculator({ 
  cartTotal, 
  cartWeight = 0, 
  onShippingSelected, 
  selectedOption,
  className = ""
}: ShippingCalculatorProps) {
  const [zipCode, setZipCode] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const { toast } = useToast();

  const calculateShippingMutation = useMutation({
    mutationFn: async (data: { zipCode: string; cartTotal: number; cartWeight: number }) => {
      const response = await apiRequest("POST", "/api/shipping/calculate", data);
      return response as unknown as ShippingOption[];
    },
    onSuccess: (options: ShippingOption[]) => {
      setShippingOptions(options);
      setIsCalculated(true);
      
      // Auto-select free shipping if available
      const freeOption = options.find(option => option.price === 0);
      if (freeOption && !selectedOption) {
        onShippingSelected(freeOption);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Shipping Calculation Failed",
        description: error.message || "Unable to calculate shipping rates",
        variant: "destructive",
      });
    }
  });

  const handleCalculateShipping = () => {
    if (!zipCode || zipCode.length < 5) {
      toast({
        title: "Invalid ZIP Code",
        description: "Please enter a valid ZIP code",
        variant: "destructive",
      });
      return;
    }

    calculateShippingMutation.mutate({
      zipCode,
      cartTotal,
      cartWeight
    });
  };

  const getShippingIcon = (carrier: string) => {
    const icons: Record<string, any> = {
      'ups': Package,
      'fedex': Truck,
      'usps': Package,
      'dhl': Truck,
      'free': Package
    };
    
    return icons[carrier.toLowerCase()] || Truck;
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-green rounded-full flex items-center justify-center">
          <Truck size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bebas">SHIPPING OPTIONS</h2>
          <p className="text-sm text-text-secondary">Calculate shipping costs to your location</p>
        </div>
      </div>

      {/* ZIP Code Input */}
      {!isCalculated && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin size={16} className="text-accent-blue" />
            Enter your ZIP code to see shipping options
          </div>
          
          <div className="flex gap-2">
            <Input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="ZIP Code"
              maxLength={5}
              className="flex-1"
            />
            <Button
              onClick={handleCalculateShipping}
              variant="primary"
              disabled={calculateShippingMutation.isPending || zipCode.length < 5}
            >
              {calculateShippingMutation.isPending ? 'Calculating...' : 'Calculate'}
            </Button>
          </div>
          
          {cartTotal >= 50 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Free shipping on orders over $50!
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shipping Options */}
      {isCalculated && shippingOptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Shipping to {zipCode}</span>
            <Button
              onClick={() => {
                setIsCalculated(false);
                setShippingOptions([]);
                setZipCode('');
              }}
              variant="ghost"
              size="sm"
            >
              Change
            </Button>
          </div>

          <div className="space-y-3">
            {shippingOptions.map((option) => {
              const Icon = getShippingIcon(option.carrier);
              const isSelected = selectedOption?.id === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => onShippingSelected(option)}
                  className={`w-full p-4 border-2 rounded-lg transition-all ${
                    isSelected 
                      ? 'border-accent-blue bg-accent-blue/5' 
                      : 'border-border hover:border-accent-blue/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon size={20} className="text-accent-blue" />
                      <div className="text-left">
                        <div className="font-semibold">{option.name}</div>
                        <div className="text-sm text-text-secondary">{option.description}</div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <Clock size={12} />
                            {option.estimatedDays}
                          </div>
                          <div className="text-xs text-text-secondary">
                            via {option.carrier.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {option.price === 0 ? 'FREE' : `$${option.price.toFixed(2)}`}
                      </div>
                      {option.price === 0 && (
                        <div className="text-xs text-green-600">Orders over $50</div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Shipping Summary */}
          {selectedOption && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Selected Shipping:</span>
                <div className="text-right">
                  <div className="font-semibold">{selectedOption.name}</div>
                  <div className="text-sm text-text-secondary">{selectedOption.estimatedDays}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Options */}
      {isCalculated && shippingOptions.length === 0 && (
        <div className="text-center py-8">
          <Package className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-text-secondary">No shipping options available for this location</p>
          <Button
            onClick={() => {
              setIsCalculated(false);
              setZipCode('');
            }}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            Try Different ZIP Code
          </Button>
        </div>
      )}

      {/* Free Local Delivery Option */}
      <div className="border-t border-border/30 pt-4 mt-6">
        <button
          onClick={() => onShippingSelected({
            id: 'local-delivery',
            name: 'Free Local Delivery to Your Doorstep',
            description: 'Free delivery to your doorstep in Asheville area',
            price: 0,
            estimatedDays: 'Same day or next day',
            carrier: 'local_delivery',
            service: 'local'
          })}
          className={`w-full p-4 border-2 rounded-lg transition-all ${
            selectedOption?.id === 'local-delivery'
              ? 'border-accent-blue bg-accent-blue/5' 
              : 'border-border hover:border-accent-blue/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck size={20} className="text-green-500" />
              <div className="text-left">
                <div className="font-semibold">Free Local Delivery to Your Doorstep</div>
                <div className="text-sm text-text-secondary">Asheville area residents</div>
                <div className="text-xs text-text-secondary mt-1">Same day or next day</div>
              </div>
            </div>
            <div className="font-bold text-lg text-green-600">FREE</div>
          </div>
        </button>
      </div>
    </Card>
  );
}