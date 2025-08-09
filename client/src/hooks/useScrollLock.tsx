import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // More specific approach: only lock if not interacting with dropdowns
      const activeElement = document.activeElement;
      const isDropdownOpen = document.querySelector('[role="listbox"], [role="menu"], [data-state="open"]');
      
      // Don't lock if dropdown or menu is open
      if (isDropdownOpen) {
        return;
      }
      
      // Lock scroll with position fixed to prevent scroll jump
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position and styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
}