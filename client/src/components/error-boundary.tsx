import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { ROUTES } from "@/config/routes";

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
    window.location.href = ROUTES.HOME;
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-8 relative overflow-auto">
          {/* Subtle animated background elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
          </div>
          
          <div className="max-w-md w-full relative z-10">

            {/* Error Content */}
            <div className="relative">
              {/* Icon with Animation */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-600 rounded-full blur-2xl opacity-10 animate-pulse"></div>
                  <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-full p-6 border border-gray-700/50">
                    <AlertTriangle className="w-16 h-16 text-red-400" />
                  </div>
                </div>
              </div>

              {/* Error Message Card */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50">
                <h1 className="text-2xl font-bold text-white text-center mb-4">
                  Something went wrong
                </h1>
                <p className="text-gray-400 text-center mb-8">
                  An unexpected error occurred. Please try refreshing the page or return to the homepage.
                </p>

                {this.state.error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                    <p className="text-red-300 text-sm font-mono">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all border border-gray-700"
                  >
                    <Home className="w-5 h-5" />
                    Home
                  </button>
                </div>
              </div>

              {/* Additional Help Text */}
              <p className="text-center text-gray-500 text-sm mt-8">
                Unexpected Error | Need help? 
                <a href="/contact" className="text-blue-500 hover:text-blue-400 ml-1">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-8 relative overflow-auto">
      {/* Subtle animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="max-w-md w-full relative z-10">

        {/* Error Content */}
        <div className="relative">
          {/* Icon with Animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600 rounded-full blur-2xl opacity-10 animate-pulse"></div>
              <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-full p-6 border border-gray-700/50">
                <div className="text-6xl">{icon}</div>
              </div>
            </div>
          </div>

          {/* Error Code */}
          <div className="text-center mb-4">
            <span className="text-6xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
              {status}
            </span>
          </div>

          {/* Error Message Card */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50">
            <h1 className="text-2xl font-bold text-white text-center mb-4">
              {errorTitle}
            </h1>
            <p className="text-gray-400 text-center mb-8">
              {errorMessage}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
              >
                <Home className="w-5 h-5" />
                Go Home
              </button>
              
              <button
                onClick={handleGoBack}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all border border-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>

          {/* Additional Help Text */}
          <p className="text-center text-gray-500 text-sm mt-8">
            Error Code: {status} | Need help? 
            <a href="/contact" className="text-blue-500 hover:text-blue-400 ml-1">
              Contact Support
            </a>
          </p>
        </div>
      </div>
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
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50 text-center">
      {/* Icon with subtle animation */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-10 animate-pulse"></div>
          <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-full p-4 border border-gray-700/50">
            <AlertTriangle className="h-12 w-12 text-red-400" />
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">
        {status === 401 ? "Authentication Required" : "Error"}
      </h3>
      <p className="text-gray-400 mb-6">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}