import { useEffect, useRef } from 'react';

/**
 * Safe portal hook that prevents removeChild errors
 * Creates a portal container that's properly managed during component lifecycle
 */
export function useSafePortal() {
  const portalRoot = useRef<HTMLDivElement | null>(null);
  const isCleaningUp = useRef(false);

  useEffect(() => {
    // Create portal container
    if (!portalRoot.current) {
      portalRoot.current = document.createElement('div');
      portalRoot.current.className = 'portal-root';
      document.body.appendChild(portalRoot.current);
    }

    return () => {
      // Mark as cleaning up to prevent race conditions
      isCleaningUp.current = true;
      
      const root = portalRoot.current;
      if (root) {
        // Use requestAnimationFrame + setTimeout to ensure all animations complete
        requestAnimationFrame(() => {
          setTimeout(() => {
            // Double-check the element is still a child and we're not in a race condition
            if (root && root.parentNode === document.body && !isCleaningUp.current) {
              try {
                document.body.removeChild(root);
              } catch (error) {
                // Silently handle cases where element was already removed
                // Portal cleanup: element already removed
              }
            }
          }, 500); // Delay to allow animations to complete
        });
      }
    };
  }, []);

  return {
    portalRoot: portalRoot.current,
    isReady: !!portalRoot.current
  };
}