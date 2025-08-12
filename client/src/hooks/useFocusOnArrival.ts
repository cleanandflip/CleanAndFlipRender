import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook to focus search input when arriving at products page with ?focus=search
 * Used when user clicks "Shop" link in header to immediately focus search
 */
export function useFocusOnArrival() {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Check if we should focus search on arrival
    const urlParams = new URLSearchParams(window.location.search);
    const shouldFocus = urlParams.get('focus') === 'search';
    
    if (shouldFocus) {
      // Small delay to ensure search input is rendered
      setTimeout(() => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 100);
      
      // Clean up the focus parameter from URL
      urlParams.delete('focus');
      const cleanQuery = urlParams.toString();
      const cleanPath = `/products${cleanQuery ? `?${cleanQuery}` : ''}`;
      
      // Replace current history entry to remove focus param
      window.history.replaceState({}, '', cleanPath);
    }
  }, [location]);
}