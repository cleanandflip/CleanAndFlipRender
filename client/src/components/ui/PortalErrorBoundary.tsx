import React, { Component, ReactNode } from 'react';

interface PortalErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface PortalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Error boundary specifically designed to catch and handle portal-related removeChild errors
 * Prevents crashes from DOM manipulation race conditions
 */
export class PortalErrorBoundary extends Component<PortalErrorBoundaryProps, PortalErrorBoundaryState> {
  constructor(props: PortalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PortalErrorBoundaryState {
    // Check if it's a portal-related error
    const isPortalError = error.message.includes('removeChild') || 
                         error.message.includes('appendChild') ||
                         error.message.includes('insertBefore') ||
                         error.message.includes('Node');
    
    if (isPortalError) {
      console.warn('Portal DOM manipulation error caught:', error.message);
      return { hasError: true, error };
    }
    
    // Re-throw non-portal errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (error.message.includes('removeChild') || 
        error.message.includes('portal') ||
        error.message.includes('DOM')) {
      console.warn('Portal cleanup error caught and handled:', error, errorInfo);
      
      // Auto-recover after a brief delay
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      // Return fallback UI or retry
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

/**
 * Hook version for functional components
 */
export function usePortalErrorHandler() {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      if (error && (
        error.message?.includes('removeChild') ||
        error.message?.includes('appendChild') ||
        error.message?.includes('portal')
      )) {
        console.warn('Portal error caught by global handler:', error.message);
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
}