// ENVIRONMENT DETECTION
export const environment = {
  isReplit: window.location.hostname.includes('repl'),
  isEmbed: window.parent !== window,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Disable Replit-specific features
  disableReplitEmbeds: () => {
    if (environment.isReplit || environment.isEmbed) {
      // Remove all Replit event listeners
      const replitHandlers = (window as any).__replitHandlers;
      if (replitHandlers) {
        replitHandlers.forEach((handler: any) => {
          window.removeEventListener('beforeunload', handler);
        });
      }
      
      // Clear onbeforeunload
      window.onbeforeunload = null;
      
      // Prevent future additions
      Object.defineProperty(window, 'onbeforeunload', {
        set: function(value) {
          if (value && value.toString().includes('replit')) {
            return;
          }
          this._onbeforeunload = value;
        },
        get: function() {
          return this._onbeforeunload;
        }
      });
    }
  }
};

// Auto-disable on load
if (typeof window !== 'undefined') {
  environment.disableReplitEmbeds();
}