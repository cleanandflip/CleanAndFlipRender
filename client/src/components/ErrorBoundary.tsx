import React from "react";
import { reportClientError } from "@/lib/errorTracking";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error,
      errorId: `boundary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to our local error tracking system
    reportClientError({ 
      message: error?.message ?? "React component error", 
      type: error?.name || "ComponentError",
      stack: error?.stack, 
      extra: { 
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId: this.state.errorId
      } 
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
              <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
              <p className="text-text-secondary mb-4">
                We apologize for the inconvenience. The error has been automatically reported.
              </p>
              {this.state.errorId && (
                <p className="text-sm text-text-muted font-mono bg-glass rounded px-3 py-1 mb-4">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.resetError}
                className="bg-accent-blue hover:bg-blue-500 text-white"
              >
                <RefreshCw className="mr-2" size={16} />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="glass border-border"
              >
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Error Details (Development)
                </summary>
                <pre className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-xs overflow-auto max-h-32 text-red-800 dark:text-red-200">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const captureError = React.useCallback((error: Error) => {
    reportClientError({
      message: error.message,
      type: error.name,
      stack: error.stack,
      extra: { source: "useErrorBoundary" }
    });
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}