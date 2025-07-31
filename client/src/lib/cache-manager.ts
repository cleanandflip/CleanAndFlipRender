import { QueryClient } from "@tanstack/react-query";

export const cacheManager = {
  // Invalidate all product-related caches
  invalidateProductCaches: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    queryClient.invalidateQueries({ queryKey: ["/api/products/featured"] });
    queryClient.invalidateQueries({ queryKey: ["wishlist-batch"] });
  },
  
  // Clear all user-specific caches on logout
  clearUserCaches: (queryClient: QueryClient) => {
    queryClient.removeQueries({ queryKey: ["/api/user"] });
    queryClient.removeQueries({ queryKey: ["/api/wishlist"] });
    queryClient.removeQueries({ queryKey: ["/api/orders"] });
    queryClient.removeQueries({ queryKey: ["/api/addresses"] });
    queryClient.removeQueries({ queryKey: ["/api/cart"] });
    queryClient.removeQueries({ queryKey: ["/api/submissions"] });
  },
  
  // Global cache reset
  resetAllCaches: (queryClient: QueryClient) => {
    queryClient.clear();
    // Clear any localStorage caches
    localStorage.removeItem('product-images-cache');
    localStorage.removeItem('user-preferences');
    localStorage.removeItem('cart-cache');
  },

  // Force refresh specific product data
  refreshProduct: (queryClient: QueryClient, productId: string) => {
    queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
  }
};

// Cache-busting utility for images
export const getProductImageUrl = (imageUrl: string, updatedAt?: string | Date) => {
  if (!imageUrl) return '';
  
  // Use updatedAt as version for cache busting
  const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}v=${version}`;
};

// Real-time data sync configuration
export const realtimeConfig = {
  // Queries that need real-time updates
  realtimeQueries: [
    "/api/wishlist",
    "/api/cart", 
    "/api/products",
    "/api/orders"
  ],
  
  // Queries that should always be fresh
  noStaleQueries: [
    "/api/user",
    "/api/addresses", 
    "/api/submissions"
  ],
  
  // Static content that can be cached longer
  staticQueries: [
    "/api/categories"
  ]
};