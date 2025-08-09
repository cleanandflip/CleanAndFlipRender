import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent scrolling by listening to wheel and touch events
      const preventScroll = (e: Event) => {
        // Allow scrolling within dropdown elements
        const target = e.target as Element;
        
        // Check if the scroll is happening within a dropdown or scrollable element
        if (target?.closest('.overflow-auto, .max-h-64, [data-radix-dropdown-menu-content]')) {
          return; // Allow scrolling in dropdown
        }
        
        // Prevent body scrolling
        e.preventDefault();
      };
      
      // Apply position fixed to prevent scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Add event listeners to prevent scroll
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      
      return () => {
        // Restore scroll position and styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        // Remove event listeners
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('touchmove', preventScroll);
        
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
}