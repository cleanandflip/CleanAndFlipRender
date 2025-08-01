import { useLocation } from "wouter";

/**
 * Centralized navigation hook for the Clean & Flip application
 * Provides consistent navigation methods throughout the app
 */
export const useNavigation = () => {
  const [location, setLocation] = useLocation();
  
  return {
    // Core navigation
    navigate: setLocation,
    currentPath: location,
    goBack: () => window.history.back(),
    
    // Common page navigations
    goToHome: () => setLocation("/"),
    goToProducts: () => setLocation("/products"),
    goToProduct: (id: string) => setLocation(`/products/${id}`),
    goToCart: () => setLocation("/cart"),
    goToCheckout: () => setLocation("/checkout"),
    goToDashboard: () => setLocation("/dashboard"),
    goToSubmit: () => setLocation("/submit"),
    goToAdmin: () => setLocation("/admin"),
    goToContact: () => setLocation("/contact"),
    goToAbout: () => setLocation("/about"),
    
    // Admin specific navigations
    goToAdminProducts: () => setLocation("/admin?tab=products"),
    goToAdminUsers: () => setLocation("/admin?tab=users"),
    goToAdminAnalytics: () => setLocation("/admin?tab=analytics"),
    goToAdminCategories: () => setLocation("/admin?tab=categories"),
    goToAdminSubmissions: () => setLocation("/admin?tab=submissions"),
    
    // Product form navigations
    goToNewProduct: () => setLocation("/admin/products/new"),
    goToEditProduct: (id: string) => setLocation(`/admin/products/edit/${id}`),
    
    // Utility functions
    refresh: () => window.location.reload(),
    goToEmail: (email: string, subject?: string) => {
      const mailtoUrl = subject 
        ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
        : `mailto:${email}`;
      window.location.href = mailtoUrl;
    },
    
    // Share functionality
    shareCurrentPage: async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title,
            url: window.location.href,
          });
        } catch (error) {
          // Fallback to clipboard
          await navigator.clipboard.writeText(window.location.href);
        }
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
      }
    },
    
    // External links (opens in new tab)
    openExternal: (url: string) => window.open(url, '_blank', 'noopener,noreferrer'),
    
    // URL utilities
    getCurrentUrl: () => window.location.href,
    getSearchParams: () => new URLSearchParams(window.location.search),
    updateSearchParams: (params: Record<string, string>) => {
      const searchParams = new URLSearchParams(window.location.search);
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          searchParams.set(key, value);
        } else {
          searchParams.delete(key);
        }
      });
      window.history.replaceState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
    }
  };
};

export default useNavigation;