import { useEffect } from 'react';

export function useBackButton() {
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Restore any saved state
      const savedState = event.state;
      if (savedState?.scrollPosition) {
        setTimeout(() => {
          window.scrollTo(0, savedState.scrollPosition);
        }, 0);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
}