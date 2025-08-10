import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorReporter } from '@/services/errorReporter';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorId: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our error reporting service
    errorReporter.captureComponentError(error, errorInfo);
    
    // Store error ID for user reference
    this.setState({ errorId: Date.now().toString() });
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
              <p className="text-muted-foreground mb-4">
                We apologize for the inconvenience. The error has been automatically reported to our team.
              </p>
              
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground mb-4">
                  Error ID: {this.state.errorId}
                </p>
              )}
              
              {import.meta.env.DEV && this.state.error && (
                <details className="text-left mb-4">
                  <summary className="text-sm font-medium cursor-pointer mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleRetry} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;