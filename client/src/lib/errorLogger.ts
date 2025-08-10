// Client-side error logging
export interface ClientErrorData {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  component?: string;
  action?: string;
  userContext?: any;
  breadcrumbs?: string[];
  timestamp: number;
}

class ClientErrorLogger {
  private static instance: ClientErrorLogger;
  private isSetup = false;

  static getInstance(): ClientErrorLogger {
    if (!ClientErrorLogger.instance) {
      ClientErrorLogger.instance = new ClientErrorLogger();
    }
    return ClientErrorLogger.instance;
  }

  setup() {
    if (this.isSetup) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        component: 'window',
        action: 'error',
        timestamp: Date.now()
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        component: 'window',
        action: 'unhandledrejection',
        timestamp: Date.now()
      });
    });

    // Console error override to capture console.error calls
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      originalConsoleError(...args);
      
      const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
      ).join(' ');
      
      this.logError({
        message: `Console Error: ${message}`,
        url: window.location.href,
        userAgent: navigator.userAgent,
        component: 'console',
        action: 'error',
        timestamp: Date.now()
      });
    };

    this.isSetup = true;
    console.log('🔍 Client error logging initialized');
  }

  async logError(errorData: ClientErrorData) {
    try {
      // DISABLED - preventing crash loop
      // await fetch('/api/errors/client', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   credentials: 'include',
      //   body: JSON.stringify(errorData)
      // });
      console.warn('Error captured (disabled):', errorData.message);
    } catch (err) {
      // Silently fail to avoid recursive errors
      console.warn('Failed to log client error:', err);
    }
  }

  // Manual error logging for React components
  logComponentError(error: Error, component: string, action?: string, context?: any) {
    this.logError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      component,
      action: action || 'component-error',
      userContext: context,
      timestamp: Date.now()
    });
  }

  // Log user actions for breadcrumbs
  logUserAction(action: string, details?: any) {
    // This could be enhanced to build breadcrumbs
    console.debug(`User Action: ${action}`, details);
  }
}

export const clientErrorLogger = ClientErrorLogger.getInstance();