import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireCompleteProfile?: boolean;
}

export function ProtectedRoute({ children, requireCompleteProfile = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  // Require profile completion for shopping functionality
  if (requireCompleteProfile && !user.profileComplete && !window.location.pathname.includes('onboarding')) {
    return <Redirect to="/onboarding?required=true" />;
  }
  
  return <>{children}</>;
}

export default ProtectedRoute;