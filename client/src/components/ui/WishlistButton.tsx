import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
};

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24
};

export function WishlistButton({ 
  productId, 
  size = 'md', 
  className = '',
  showTooltip = true 
}: WishlistButtonProps) {
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const isInWishlist = isWishlisted(productId);
  const loading = toggleWishlist.isPending;
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }
    
    toggleWishlist.mutate(productId);
  };
  
  return (
    <div className="relative group">
      <button
        onClick={handleWishlistToggle}
        disabled={loading}
        className={cn(
          sizeClasses[size],
          'rounded-full flex items-center justify-center',
          'transition-all duration-300 transform',
          isInWishlist 
            ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/25' 
            : 'bg-gray-700/80 text-gray-300 hover:bg-red-500/20 hover:text-red-400 hover:shadow-md hover:scale-110',
          loading ? 'opacity-50 cursor-not-allowed animate-pulse' : 'cursor-pointer',
          className
        )}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart 
          size={iconSizes[size]}
          className={`transition-all duration-300 ${loading ? 'animate-pulse' : ''}`}
          fill={isInWishlist ? 'currentColor' : 'none'}
        />
      </button>
      
      {/* Tooltip */}
      {showTooltip && !showLoginPrompt && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-gray-800/95 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-gray-600">
            {loading ? 'Updating...' : isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          </div>
        </div>
      )}
      
      {/* Login prompt */}
      {showLoginPrompt && !user && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-red-500/90 text-white text-xs px-3 py-2 rounded whitespace-nowrap animate-pulse">
            Please log in to save items
          </div>
        </div>
      )}
    </div>
  );
}