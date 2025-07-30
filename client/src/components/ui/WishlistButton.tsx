import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface WishlistButtonProps {
  productId: string;
  size?: 'small' | 'default';
  className?: string;
  showTooltip?: boolean;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({ 
  productId, 
  size = 'default',
  className = '',
  showTooltip = true 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Check wishlist status on mount and when user changes
  useEffect(() => {
    if (user && productId) {
      checkWishlistStatus();
    } else {
      setIsWishlisted(false);
    }
  }, [user, productId]);

  // Listen for global wishlist updates
  useEffect(() => {
    const handleWishlistUpdate = (event: CustomEvent<{ productId: string; action: string }>) => {
      if (event.detail.productId === productId) {
        setIsWishlisted(event.detail.action === 'added');
      }
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate as EventListener);
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdate as EventListener);
  }, [productId]);
  
  const checkWishlistStatus = async () => {
    try {
      const response = await fetch('/api/wishlist/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ productId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsWishlisted(data.isWishlisted);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };
  
  const handleWishlistToggle = async (e: React.MouseEvent) => {
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
    
    setLoading(true);
    
    try {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const response = await fetch('/api/wishlist', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ productId })
      });
      
      if (response.ok) {
        const newStatus = !isWishlisted;
        setIsWishlisted(newStatus);
        
        toast({
          title: newStatus ? "Added to wishlist" : "Removed from wishlist",
          description: newStatus ? "Item saved to your wishlist" : "Item removed from your wishlist"
        });
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('wishlistUpdated', {
          detail: { productId, action: newStatus ? 'added' : 'removed' }
        }));
      } else {
        throw new Error('Failed to update wishlist');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-10 h-10'
  };
  
  const iconSize = size === 'small' ? 16 : 20;
  
  return (
    <div className="relative group">
      <button
        onClick={handleWishlistToggle}
        disabled={loading}
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center
          transition-all duration-300 transform
          ${isWishlisted 
            ? 'bg-red-500/90 backdrop-blur-sm text-white scale-110 shadow-lg shadow-red-500/25' 
            : 'bg-gray-700/80 backdrop-blur-sm text-gray-300 hover:bg-gray-600 hover:shadow-md hover:scale-110'
          }
          ${loading ? 'opacity-50 cursor-not-allowed animate-pulse' : 'cursor-pointer'}
          ${className}
        `}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart 
          size={iconSize}
          className={`transition-all duration-300 ${loading ? 'animate-pulse' : ''}`}
          fill={isWishlisted ? 'currentColor' : 'none'}
        />
      </button>
      
      {/* Tooltip */}
      {showTooltip && !showLoginPrompt && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-gray-800/95 backdrop-blur-sm text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-gray-600">
            {loading ? 'Updating...' : isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          </div>
        </div>
      )}
      
      {/* Login prompt */}
      {showLoginPrompt && !user && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-red-500/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded whitespace-nowrap animate-pulse">
            Please log in to save items
          </div>
        </div>
      )}
    </div>
  );
};