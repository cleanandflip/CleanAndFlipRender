/**
 * Step 3: Summary and Completion 
 * Shows normalized address and phone, completes setup
 */

import { useState } from 'react';
import { CheckCircle, ArrowLeft, MapPin, Phone, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface StepSummaryProps {
  onNext: () => void;
  onBack: () => void;
  data: {
    address?: any;
    phone?: string;
  };
  isLoading?: boolean;
}

const StepSummary = ({ onNext, onBack, data, isLoading = false }: StepSummaryProps) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    onNext();
  };

  // Format address for display
  const formatAddress = (address: any) => {
    if (!address) return 'No address provided';
    
    const parts = [
      address.street1,
      address.street2,
      address.city,
      address.state,
      address.postalCode
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Almost ready!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review your information and complete your profile setup
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Address Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Delivery Address
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {formatAddress(data.address)}
                </p>
                
                {/* Local delivery indicator */}
                {data.address?.isLocal && (
                  <div className="flex items-center gap-2 mt-2">
                    <Truck className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Free local delivery available
                    </span>
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onBack}
                disabled={isLoading || isCompleting}
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Phone Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Phone Number
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {data.phone || 'No phone number provided'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onBack}
                disabled={isLoading || isCompleting}
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What's Next */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          🎉 What's next?
        </h3>
        <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2">
          <li>• Browse our curated fitness equipment catalog</li>
          <li>• Get instant quotes for equipment you want to sell</li>
          <li>• Track orders and deliveries in your dashboard</li>
          <li>• Join our community of fitness enthusiasts</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading || isCompleting}
          className="flex-1"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Edit Phone
        </Button>
        
        <Button
          onClick={handleComplete}
          disabled={isLoading || isCompleting}
          className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          data-testid="button-complete"
        >
          {isCompleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
              Completing...
            </>
          ) : (
            <>
              Complete Setup
              <CheckCircle className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepSummary;