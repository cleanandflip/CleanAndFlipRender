import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/hooks/use-wishlist';
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

export const WishlistButton: React.FC<WishlistButtonProps> = ({ 
  productId, 
  size = 'md',
  className = '',
  showTooltip = true
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist, isToggling } = useWishlist();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const isWishlistItem = isInWishlist(productId);
  const loading = isToggling;
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setShowLoginPrompt(true);
      toast({
        title: "Login required",
        description: "Please log in to save items to your wishlist",
        variant: "destructive"
      });
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }
    
    if (loading) return;
    
    toggleWishlist(productId);
  };

  // Show loading skeleton if not authenticated
  if (!user) {
    return (
      <div className={cn(sizeClasses[size], "rounded-full bg-gray-700/50 animate-pulse")} />
    );
  }
  
  return (
    <div className="relative group">
      <button
        onClick={handleWishlistToggle}
        disabled={loading}
        className={cn(
          sizeClasses[size],
          "rounded-full flex items-center justify-center",
          "transition-all duration-300 transform",
          isWishlistItem 
            ? "bg-red-500/90 text-white scale-110 shadow-lg shadow-red-500/25" 
            : "bg-gray-700/80 text-gray-300 hover:bg-gray-600 hover:shadow-md hover:scale-110",
          loading && "opacity-50 cursor-not-allowed animate-pulse",
          !loading && "cursor-pointer",
          className
        )}
        aria-label={isWishlistItem ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart 
          size={iconSizes[size]}
          className={cn("transition-all duration-300", loading && "animate-pulse")}
          fill={isWishlistItem ? 'currentColor' : 'none'}
        />
      </button>
      
      {/* Tooltip */}
      {showTooltip && !showLoginPrompt && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-gray-800/95 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-gray-600">
            {loading ? 'Updating...' : isWishlistItem ? 'Remove from wishlist' : 'Add to wishlist'}
          </div>
        </div>
      )}
      
      {/* Login prompt */}
      {showLoginPrompt && !user && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                        opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-red-600/95 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-red-500">
            Login required
          </div>
        </div>
      )}
    </div>
  );
};