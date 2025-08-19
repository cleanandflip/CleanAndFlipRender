import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

type AuthResponse = {
  authenticated: boolean;
  user: any | null;
  session?: { id?: string; guest?: boolean };
};

const fetchUser = async (): Promise<AuthResponse> => {
  const res = await fetch('/api/user', {
    credentials: 'include',
    headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
    cache: 'no-store',
  });
  // Your API always returns 200; parse and use the flag:
  return res.json();
};

export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: fetchUser,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: false,
  });
}

  // ONBOARDING REMOVED - No more auto-redirects, users browse freely

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Normalize email for case-insensitive login
      const normalizedCredentials = {
        ...credentials,
        email: credentials.email.toLowerCase().trim()
      };
      
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedCredentials),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        const error = new Error(result.details || result.error || "Login failed");
        Object.assign(error, { code: result.code, suggestion: result.suggestion });
        throw error;
      }

      return result.user || result;
    },
    onSuccess: async (user: SelectUser) => {
      // CRITICAL FIX: Wait for session to propagate before updating cache
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update query cache with new user data
      queryClient.setQueryData(["/api/user"], user);
      
      // Force refetch to verify session persistence  
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.email}`,
      });
    },
    onError: (error: Error & { suggestion?: string }) => {
      let description = error.message;
      if (error.suggestion) {
        description += ` ${error.suggestion}`;
      }
      toast({
        title: "Login Failed",
        description,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      // Normalize email for case-insensitive registration
      const normalizedCredentials = {
        ...credentials,
        email: credentials.email.toLowerCase().trim()
      };
      
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedCredentials),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        const error = new Error(result.details || result.error || "Registration failed");
        Object.assign(error, { code: result.code, suggestion: result.suggestion });
        throw error;
      }

      return result.user || result;
    },
    onSuccess: async (user: SelectUser) => {
      // CRITICAL FIX: Wait for session to propagate after registration
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update query cache with new user data
      queryClient.setQueryData(["/api/user"], user);
      
      // Force refetch to verify session persistence
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Account created!",
        description: `Welcome to Clean & Flip, ${user.firstName || user.email}!`,
      });
    },
    onError: (error: Error & { suggestion?: string; code?: string }) => {
      let description = error.message;
      if (error.suggestion) {
        description += ` ${error.suggestion}`;
      }
      
      // Special handling for existing email
      if (error.code === "EMAIL_EXISTS") {
        toast({
          title: "Account Already Exists",
          description: error.message,
          variant: "destructive",
          action: (
            <button 
              onClick={() => window.location.hash = "#login"}
              className="text-sm underline"
            >
              Go to Sign In
            </button>
          ),
        });
        return;
      }
      
      toast({
        title: "Registration Failed",
        description,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // CRITICAL FIX: Complete client-side cleanup
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.clear(); // Clear all cached queries to prevent hooks issues
      
      // Clear any potential browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force immediate refetch to ensure clean state
      setTimeout(() => {
        window.location.href = '/'; // Redirect to home after cleanup
      }, 100);
      
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated: !!user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}