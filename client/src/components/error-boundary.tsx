import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/common/glass-card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6">
          <GlassCard className="max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <AlertTriangle className="mx-auto h-16 w-16 text-red-400 mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
              <p className="text-gray-300">
                An unexpected error occurred. Please try refreshing the page or return to the homepage.
              </p>
            </div>

            {this.state.error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                <p className="text-red-300 text-sm font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={this.handleRetry}
                className="w-full bg-accent-blue hover:bg-blue-600"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full glass border-glass-border text-white hover:bg-white/10"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

// Dynamic error component for different error types
interface ErrorPageProps {
  status?: number;
  message?: string;
  title?: string;
}

export function ErrorPage({ status = 404, message, title }: ErrorPageProps) {
  const getErrorContent = () => {
    switch (status) {
      case 404:
        return {
          title: title || "Page Not Found",
          message: message || "The page you're looking for doesn't exist.",
          icon: "🔍"
        };
      case 403:
        return {
          title: title || "Access Denied",
          message: message || "You don't have permission to access this page.",
          icon: "🔒"
        };
      case 500:
        return {
          title: title || "Server Error",
          message: message || "Something went wrong on our end. Please try again later.",
          icon: "⚠️"
        };
      default:
        return {
          title: title || "Error",
          message: message || "An unexpected error occurred.",
          icon: "❌"
        };
    }
  };

  const { title: errorTitle, message: errorMessage, icon } = getErrorContent();

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6">
      <GlassCard className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">{icon}</div>
          <h1 className="text-3xl font-bold text-white mb-2">{status}</h1>
          <h2 className="text-xl font-semibold text-gray-300 mb-4">{errorTitle}</h2>
          <p className="text-gray-400">{errorMessage}</p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleGoHome}
            className="w-full bg-accent-blue hover:bg-blue-600"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
          
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="w-full glass border-glass-border text-white hover:bg-white/10"
          >
            Go Back
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

// API Error component for handling API-specific errors
interface ApiErrorProps {
  status: number;
  message: string;
  onRetry?: () => void;
}

export function ApiError({ status, message, onRetry }: ApiErrorProps) {
  return (
    <GlassCard className="p-6 text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">
        {status === 401 ? "Authentication Required" : "Error"}
      </h3>
      <p className="text-gray-300 mb-4">{message}</p>
      
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline" 
          className="glass border-glass-border"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </GlassCard>
  );
}