import { useAuth } from '@/hooks/use-auth';

export function LocalStatusBar() {
  const { user } = useAuth();
  const isLocal = user?.isLocalCustomer;
  
  if (!user) return null; // Don't show for non-logged users
  
  return (
    <div className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-8 flex items-center justify-center">
          {isLocal ? (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-500 font-medium tracking-wide">
                Free Local Delivery & Pickup Active • Asheville Area
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-500">
              Standard shipping rates apply to your area
            </span>
          )}
        </div>
      </div>
    </div>
  );
}