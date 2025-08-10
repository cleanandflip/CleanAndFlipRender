import { useState } from 'react';
import { Info, X, Package, Truck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function FloatingLocalInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const isLocal = user?.isLocalCustomer;
  
  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        className="fixed bottom-6 right-6 p-3 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-full shadow-lg z-40"
      >
        <Info className="h-5 w-5" />
      </Button>
      
      {/* Info Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <Card className="relative w-96 max-w-full mb-20 mr-2 p-6 shadow-xl border-2">
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <h4 className="font-bebas text-lg mb-4 text-text-primary">LOCAL SERVICES INFO</h4>
            
            <div className="space-y-4 text-sm">
              <div className={`p-3 rounded-lg ${isLocal ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Package className={`h-4 w-4 ${isLocal ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="font-medium">When You SELL to Us:</div>
                </div>
                <div className={!isLocal ? 'line-through text-gray-500' : 'text-text-secondary'}>
                  FREE pickup from your location
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  We come to you and collect your equipment
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${isLocal ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Truck className={`h-4 w-4 ${isLocal ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="font-medium">When You BUY from Us:</div>
                </div>
                <div className={!isLocal ? 'line-through text-gray-500' : 'text-text-secondary'}>
                  FREE delivery to your doorstep
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  We bring your purchase directly to you
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="font-medium mb-1">Your Location Status:</div>
                <div className="text-xs">
                  {isLocal ? (
                    <span className="text-green-600 font-medium">
                      ✅ Asheville Area - Both services available FREE
                    </span>
                  ) : (
                    <span className="text-gray-600">
                      📍 Outside Asheville area - Standard shipping rates apply
                    </span>
                  )}
                </div>
                {!isLocal && (
                  <div className="text-xs text-gray-500 mt-2">
                    ZIP codes 287xx-288xx qualify for free services
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                Sell Equipment
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Shop Equipment
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}