// Client-side error logging service

interface Breadcrumb {
  type: string;
  target?: string;
  message: string;
  timestamp: Date;
  category?: string;
  data?: any;
  level?: string;
}

interface ErrorData {
  severity: 'critical' | 'error' | 'warning' | 'info';
  error_type: string;
  message: string;
  stack_trace?: string;
  file_path?: string;
  line_number?: number;
  column_number?: number;
  url?: string;
  response_status?: number;
  breadcrumbs?: Breadcrumb[];
  user_id?: string;
  user_email?: string;
  browser?: string;
  timestamp?: Date;
}

export class FrontendErrorCatcher {
  private static breadcrumbs: Breadcrumb[] = [];
  private static maxBreadcrumbs = 50;
  private static initialized = false;
  
  static init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. CATCH ALL JAVASCRIPT ERRORS
    window.addEventListener('error', (event: ErrorEvent) => {
      this.logError({
        severity: 'error',
        error_type: 'javascript_error',
        message: event.message,
        stack_trace: event.error?.stack,
        file_path: event.filename,
        line_number: event.lineno,
        column_number: event.colno,
        url: window.location.href,
        breadcrumbs: [...this.breadcrumbs]
      });
    });
    
    // 2. CATCH UNHANDLED PROMISE REJECTIONS
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.logError({
        severity: 'error',
        error_type: 'promise_rejection',
        message: event.reason?.message || String(event.reason),
        stack_trace: event.reason?.stack,
        url: window.location.href,
        breadcrumbs: [...this.breadcrumbs]
      });
    });
    
    // 3. CATCH NETWORK/API ERRORS
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && response.status >= 400) {
          this.logError({
            severity: response.status >= 500 ? 'critical' : 'warning',
            error_type: 'api_error',
            message: `API Error: ${response.status} ${response.statusText}`,
            url: args[0] as string,
            response_status: response.status
          });
        }
        return response;
      } catch (error: any) {
        this.logError({
          severity: 'critical',
          error_type: 'network_error',
          message: `Network Error: ${error.message}`,
          url: args[0] as string
        });
        throw error;
      }
    };
    
    // 4. TRACK USER ACTIONS (Breadcrumbs)
    ['click', 'input', 'submit'].forEach(eventType => {
      document.addEventListener(eventType, (event: Event) => {
        const target = event.target as HTMLElement;
        this.addBreadcrumb({
          type: eventType,
          target: target?.tagName,
          message: `User ${eventType} on ${target?.tagName}${target?.id ? '#' + target.id : ''}${target?.className && typeof target.className === 'string' ? '.' + target.className.split(' ')[0] : ''}`,
          timestamp: new Date()
        });
      }, true);
    });
    
    // 5. CONSOLE ERROR INTERCEPTION
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.logError({
        severity: 'error',
        error_type: 'console_error',
        message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
        url: window.location.href
      });
      originalConsoleError.apply(console, args);
    };

    // 6. CONSOLE WARN INTERCEPTION
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      this.logError({
        severity: 'warning',
        error_type: 'console_warning',
        message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
        url: window.location.href
      });
      originalConsoleWarn.apply(console, args);
    };

    console.log('🔍 Client error logging initialized');
  }
  
  private static async logError(errorData: ErrorData) {
    try {
      // Add user context
      const currentUser = this.getCurrentUser();
      errorData.user_id = currentUser?.id;
      errorData.user_email = currentUser?.email;
      errorData.browser = navigator.userAgent;
      errorData.timestamp = new Date();
      
      // FLAWLESS ERROR LOGGING - guaranteed no crashes
      try {
        await fetch('/api/errors/client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
          credentials: 'include'
        });
      } catch {
        // Absolutely silent failure - no retries, no console output, no exceptions
      }
      
    } catch (err) {
      // Silent failure - no console output to prevent loops
    }
  }
  
  private static addBreadcrumb(crumb: Breadcrumb) {
    this.breadcrumbs.push(crumb);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  private static getCurrentUser() {
    // Try to get current user from various sources
    try {
      // Check if there's user data in localStorage/sessionStorage
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userData) {
        return JSON.parse(userData);
      }
      
      // Check global window object (if set by the app)
      if ((window as any).__USER__) {
        return (window as any).__USER__;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  // Public method to manually log errors
  static logCustomError(errorData: Partial<ErrorData>) {
    this.logError({
      severity: 'error',
      error_type: 'custom',
      message: 'Custom error',
      url: window.location.href,
      ...errorData
    });
  }
}