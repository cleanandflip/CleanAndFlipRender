interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  metadata?: any;
}

interface PerformanceMetric {
  name: string;
  value: number;
  url: string;
  timestamp: string;
}

class ErrorReporter {
  private breadcrumbs: Array<{ action: string; data: any; timestamp: string }> = [];
  private userContext: any = null;
  private maxBreadcrumbs = 50;

  // Capture JavaScript errors
  captureException(error: Error, context?: ErrorContext): void {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        breadcrumbs: this.breadcrumbs.slice(-10), // Last 10 breadcrumbs
        userContext: this.userContext,
        ...context
      };

      // Send to backend
      fetch('/api/errors/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      }).catch(console.error);

      // Log to console in development
      if (import.meta.env.DEV) {
        console.error('Client error captured:', errorData);
      }
    } catch (captureError) {
      console.error('Failed to capture error:', captureError);
    }
  }

  // Capture log messages
  captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info', context?: ErrorContext): void {
    try {
      const logData = {
        message,
        level,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        breadcrumbs: this.breadcrumbs.slice(-5), // Last 5 breadcrumbs
        userContext: this.userContext,
        ...context
      };

      fetch('/api/errors/client-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      }).catch(console.error);
    } catch (captureError) {
      console.error('Failed to capture message:', captureError);
    }
  }

  // React Error Boundary integration
  captureComponentError(error: Error, errorInfo: any): void {
    this.captureException(error, {
      component: errorInfo.componentStack?.split('\n')[1]?.trim(),
      action: 'component_error',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });
  }

  // Network error capture
  captureNetworkError(url: string, status: number, error: any): void {
    this.captureMessage(`Network error: ${status} ${error}`, 'error', {
      action: 'network_error',
      url,
      metadata: { status, error }
    });
  }

  // Performance monitoring
  capturePerformance(metric: PerformanceMetric): void {
    try {
      fetch('/api/errors/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      }).catch(console.error);
    } catch (error) {
      console.error('Failed to capture performance metric:', error);
    }
  }

  // User context management
  setUserContext(user: any): void {
    this.userContext = {
      id: user?.id,
      email: user?.email,
      role: user?.role
    };
  }

  // Breadcrumb tracking
  addBreadcrumb(action: string, data: any = {}): void {
    this.breadcrumbs.push({
      action,
      data,
      timestamp: new Date().toISOString()
    });

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  // Initialize error reporting
  init(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message), {
        action: 'global_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          action: 'unhandled_promise_rejection'
        }
      );
    });

    // Track navigation
    this.addBreadcrumb('page_load', { url: window.location.href });

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        this.addBreadcrumb('user_click', {
          element: target.tagName,
          text: target.textContent?.slice(0, 100),
          className: target.className
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.addBreadcrumb('form_submit', {
        action: form.action,
        method: form.method
      });
    });

    // Performance monitoring
    if ('performance' in window && 'getEntriesByType' in performance) {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.capturePerformance({
            name: 'page_load',
            value: navigation.loadEventEnd - navigation.navigationStart,
            url: window.location.href,
            timestamp: new Date().toISOString()
          });
        }
      }, 1000);
    }
  }
}

// Create singleton instance
export const errorReporter = new ErrorReporter();

// Initialize on module load
if (typeof window !== 'undefined') {
  errorReporter.init();
}

export default errorReporter;