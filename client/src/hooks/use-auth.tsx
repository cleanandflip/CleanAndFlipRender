import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  address?: string;
  cityStateZip?: string;
  phone?: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    retry: false, // Don't retry 401s for auth checks
    throwOnError: false, // Handle errors gracefully
    staleTime: 0, // CRITICAL FIX: Don't cache user data after logout
    gcTime: 0, // CRITICAL FIX: Don't keep in cache
    refetchOnWindowFocus: false, // Don't check auth on window focus
    refetchOnMount: true, // CRITICAL FIX: Always check fresh auth state
  });

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
        (error as any).code = result.code;
        (error as any).suggestion = result.suggestion;
        throw error;
      }

      return result.user || result;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.email}`,
      });
    },
    onError: (error: any) => {
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
        (error as any).code = result.code;
        (error as any).suggestion = result.suggestion;
        throw error;
      }

      return result.user || result;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Account created!",
        description: `Welcome to Clean & Flip, ${user.firstName || user.email}!`,
      });
    },
    onError: (error: any) => {
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