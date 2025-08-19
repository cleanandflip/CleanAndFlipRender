import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({
  children,
  requireDeveloper = false,
}: {
  children: React.ReactNode;
  requireDeveloper?: boolean;
}) {
  const { data: authData, isLoading } = useAuth();
  const user = authData?.user;
  const isAuthenticated = authData?.authenticated || false;
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to auth
  }

  if (requireDeveloper && user.role !== 'developer') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-slate-300">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}