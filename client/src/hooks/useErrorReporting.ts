import { useEffect } from 'react';
import { useAuth } from './use-auth';
import { errorReporter } from '@/services/errorReporter';

export function useErrorReporting() {
  const { user } = useAuth();

  useEffect(() => {
    // Set user context for error reporting
    if (user) {
      errorReporter.setUserContext(user);
    }

    // Global error handlers are already set up in errorReporter.init()
    // but we can add additional app-specific tracking here

    const handleRouteChange = () => {
      errorReporter.addBreadcrumb('route_change', {
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search
      });
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);

    // Track initial page load
    errorReporter.addBreadcrumb('page_load', {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [user]);

  return {
    captureException: errorReporter.captureException.bind(errorReporter),
    captureMessage: errorReporter.captureMessage.bind(errorReporter),
    addBreadcrumb: errorReporter.addBreadcrumb.bind(errorReporter)
  };
}