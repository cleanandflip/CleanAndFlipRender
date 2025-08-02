import { useEffect } from 'react';

/**
 * Hook to prevent body scroll and compensate for scrollbar to avoid layout jitter
 * when modals/dialogs are opened
 */
export function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      // Store original values
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Apply scroll lock and scrollbar compensation
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.classList.add('modal-open');
      
      // Fix any fixed position elements (header, nav)
      const fixedElements = document.querySelectorAll('header, nav, [data-fixed]');
      const originalPaddings: string[] = [];
      
      fixedElements.forEach((element, index) => {
        const el = element as HTMLElement;
        originalPaddings[index] = el.style.paddingRight;
        el.style.paddingRight = `${scrollbarWidth}px`;
      });
      
      // Cleanup function
      return () => {
        // Restore body styles
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        document.body.classList.remove('modal-open');
        
        // Restore fixed elements
        fixedElements.forEach((element, index) => {
          const el = element as HTMLElement;
          el.style.paddingRight = originalPaddings[index] || '';
        });
      };
    }
  }, [isOpen]);
}