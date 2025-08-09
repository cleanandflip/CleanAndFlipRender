import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Only apply scroll lock to the main body, but preserve scrolling in modals and dropdowns
      // We use a CSS class approach instead of direct style manipulation
      document.body.classList.add('modal-scroll-lock');
      document.body.style.top = `-${scrollY}px`;
      
      return () => {
        // Restore scroll position and styles
        document.body.classList.remove('modal-scroll-lock');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
}