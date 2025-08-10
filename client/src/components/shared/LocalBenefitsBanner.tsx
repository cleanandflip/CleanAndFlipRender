import { Truck, Package, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function LocalBenefitsBanner() {
  const { user } = useAuth();
  const isLocal = user?.isLocalCustomer;
  
  // Determine if user is in Asheville area based on ZIP
  const userZip = user?.zipCode || '';
  const isAshevilleArea = userZip.startsWith('287') || userZip.startsWith('288');
  
  return (
    <div className={`
      w-full 
      py-2 px-4 
      ${isLocal ? 'bg-green-950/90' : 'bg-gray-900/95'} 
      backdrop-blur-md
      border-b border-gray-800
      shadow-sm
    `}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 md:gap-6">
        
        {/* SELLING TO US */}
        <div className={`flex items-center gap-2 ${!isLocal ? 'opacity-40' : ''}`}>
          <div className={`p-1 rounded ${isLocal ? 'bg-green-900/50' : ''}`}>
            <Package className={`h-3.5 w-3.5 ${isLocal ? 'text-green-400' : 'text-gray-500'}`} />
          </div>
          <span className={`text-xs md:text-sm font-medium whitespace-nowrap ${
            isLocal ? 'text-green-400' : 'text-gray-500 line-through decoration-gray-600'
          }`}>
            FREE Pickup When You Sell
          </span>
          {isLocal && (
            <span className="hidden sm:inline-flex text-[10px] bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded font-semibold">
              ACTIVE
            </span>
          )}
        </div>
        
        <div className="text-gray-700 hidden md:block">•</div>
        
        {/* BUYING FROM US */}
        <div className={`flex items-center gap-2 ${!isLocal ? 'opacity-40' : ''}`}>
          <div className={`p-1 rounded ${isLocal ? 'bg-green-900/50' : ''}`}>
            <Truck className={`h-3.5 w-3.5 ${isLocal ? 'text-green-400' : 'text-gray-500'}`} />
          </div>
          <span className={`text-xs md:text-sm font-medium whitespace-nowrap ${
            isLocal ? 'text-green-400' : 'text-gray-500 line-through decoration-gray-600'
          }`}>
            FREE Delivery When You Buy
          </span>
          {isLocal && (
            <span className="hidden sm:inline-flex text-[10px] bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded font-semibold">
              ACTIVE
            </span>
          )}
        </div>
        
        {/* Location Indicator - Right Side */}
        <div className="hidden md:flex items-center gap-1.5 ml-auto pl-4">
          <MapPin className="h-3 w-3 text-gray-500" />
          <span className="text-[11px] text-gray-500 font-medium">
            {isLocal ? '📍 Asheville Area' : `ZIP: ${userZip || 'Not Set'}`}
          </span>
        </div>
      </div>
      
      {/* Mobile Location Badge */}
      <div className="flex md:hidden justify-center mt-1">
        <span className="text-[10px] text-gray-500">
          {isLocal ? '📍 Asheville Area Resident' : `Your ZIP: ${userZip || 'Not Set'}`}
        </span>
      </div>
    </div>
  );
}