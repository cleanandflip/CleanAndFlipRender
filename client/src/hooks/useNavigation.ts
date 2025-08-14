import { useLocation } from "wouter";
import { ROUTES, routes } from "@/config/routes";

/**
 * 🎯 CENTRALIZED NAVIGATION SERVICE - Single source of truth for all app navigation
 * Provides consistent navigation methods throughout the app using centralized route definitions
 */
export const useNavigation = () => {
  const [location, setLocation] = useLocation();

  return {
    // Current location
    currentPath: location,
    isActive: (path: string) => location === path,
    isActiveRoute: (routePath: string) => location.startsWith(routePath),
    
    // Core navigation
    navigate: setLocation,
    
    // Public navigations
    goToHome: () => setLocation(ROUTES.HOME),
    goToProducts: () => setLocation(ROUTES.PRODUCTS),
    goToProduct: (id: string) => setLocation(routes.productDetail(id)),
    goToSearch: () => setLocation(ROUTES.SEARCH),
    goToAbout: () => setLocation(ROUTES.ABOUT),
    goToContact: () => setLocation(ROUTES.CONTACT),
    
    // Shopping navigations
    goToCart: () => setLocation(ROUTES.CART),
    goToCheckout: () => setLocation(ROUTES.CHECKOUT),
    goToCheckoutSuccess: () => setLocation(ROUTES.CHECKOUT_SUCCESS),
    
    // Auth navigations (handled by Replit Auth)
    goToLogin: () => setLocation(ROUTES.LOGIN),
    goToRegister: () => setLocation(ROUTES.REGISTER),
    
    // User navigations
    goToDashboard: () => setLocation(ROUTES.DASHBOARD),
    goToOrders: () => setLocation(ROUTES.ORDERS),
    goToSubmitEquipment: () => setLocation(ROUTES.SUBMIT_EQUIPMENT),
    goToTrackSubmission: () => setLocation(ROUTES.TRACK_SUBMISSION),
    
    // Admin navigations
    goToAdmin: () => setLocation(ROUTES.ADMIN),
    goToAdminProducts: () => setLocation(routes.adminTab('products')),
    goToAdminCategories: () => setLocation(routes.adminTab('categories')),
    goToAdminUsers: () => setLocation(routes.adminTab('users')),
    goToAdminSubmissions: () => setLocation(routes.adminTab('submissions')),
    goToAdminAnalytics: () => setLocation(routes.adminTab('analytics')),

    goToAdminSystem: () => setLocation(routes.adminTab('system')),
    goToNewProduct: () => setLocation(ROUTES.ADMIN_PRODUCT_NEW),
    goToEditProduct: (id: string) => setLocation(routes.adminProduct(id)),
    
    // Utility methods
    goBack: () => window.history.back(),
    refresh: () => {
      // Use React Query invalidation instead of hard reload
      import('@tanstack/react-query').then(({ useQueryClient }) => {
        const queryClient = useQueryClient();
        queryClient.invalidateQueries();
      }).catch(() => {
        // Fallback to safe reload only if React Query unavailable
        if (!import.meta.env.VITE_DISABLE_HARD_RELOADS) {
          window.location.reload();
        }
      });
    },
    
    // Helper for checking admin routes
    isDeveloperRoute: () => location.startsWith('/admin'),
    isUserRoute: () => ['/dashboard', '/orders'].some(route => location.startsWith(route)),
    
    // External links and utilities
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

// Export for non-hook usage (e.g., in services, utilities)
export const navigation = {
  navigate: (path: string) => {
    window.location.href = path;
  },
  goToRoute: (route: string) => {
    window.location.href = route;
  },
};

export default useNavigation;