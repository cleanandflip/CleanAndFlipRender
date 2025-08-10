import { Truck, Package, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function LocalBenefitsBanner() {
  const { user } = useAuth();
  const isLocal = user?.isLocalCustomer;
  
  // Determine if user is in Asheville area based on ZIP
  const userZip = user?.zipCode || '';
  const isAshevilleArea = userZip.startsWith('287') || userZip.startsWith('288');
  
  return (
    <div className={`w-full py-3 px-4 ${isLocal ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'} border-y`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-8">
        
        {/* SELLING TO US */}
        <div className={`flex items-center space-x-2 ${!isLocal ? 'opacity-50' : ''}`}>
          <Package className={`h-5 w-5 ${isLocal ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${isLocal ? 'text-green-800 dark:text-green-300' : 'text-gray-500 line-through'}`}>
            FREE Pickup When You Sell to Us
          </span>
          {isLocal && <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-2 py-0.5 rounded">ACTIVE</span>}
        </div>
        
        <div className="text-gray-300 dark:text-gray-600">|</div>
        
        {/* BUYING FROM US */}
        <div className={`flex items-center space-x-2 ${!isLocal ? 'opacity-50' : ''}`}>
          <Truck className={`h-5 w-5 ${isLocal ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${isLocal ? 'text-green-800 dark:text-green-300' : 'text-gray-500 line-through'}`}>
            FREE Delivery When You Buy From Us
          </span>
          {isLocal && <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-2 py-0.5 rounded">ACTIVE</span>}
        </div>
        
        {/* Location Indicator */}
        <div className="flex items-center space-x-2 ml-4">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {isLocal ? '📍 Asheville Area' : `Your ZIP: ${userZip || 'Not Set'}`}
          </span>
        </div>
      </div>
      
      {/* Non-local message */}
      {!isLocal && user && (
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            These benefits are available for Asheville area customers (ZIP 287xx-288xx). 
            <span className="font-medium"> Standard shipping rates apply to your area.</span>
          </p>
        </div>
      )}
    </div>
  );
}