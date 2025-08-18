import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isAuthenticated: boolean;
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
  const queryClient = useQueryClient();
  
  const fetchUser = async () => {
    const res = await fetch("/api/user", { credentials: "include" });
    if (!res.ok) throw new Error("user fetch failed");
    const data = await res.json();
    // Return normalized shape from new session-aware endpoint
    return { auth: !!data?.auth, user: data?.user || null };
  };

  const {
    data,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: false, // Don't retry 401s for auth checks
    throwOnError: false, // Handle errors gracefully
    refetchOnWindowFocus: false, // Prevent auth check loops
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes - CRITICAL FIX
    refetchOnReconnect: false, // Don't spam on reconnect
    refetchOnMount: true, // Always check fresh auth state
  });

  const user = data?.user;
  const isAuthenticated = !!data?.auth;

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
      queryClient.setQueryData(["user"], { auth: true, user });
      
      // Force refetch to verify session persistence  
      await queryClient.refetchQueries({ queryKey: ["user"] });
      
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
      queryClient.setQueryData(["user"], { auth: true, user });
      
      // Force refetch to verify session persistence
      await queryClient.refetchQueries({ queryKey: ["user"] });
      
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
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: async () => {
      // Clear all cached user data and navigation state
      queryClient.removeQueries({ queryKey: ["user"], exact: false });
      localStorage.removeItem("nav_state");
      sessionStorage.clear();
      // Full reload ensures all in-memory state resets and cookie changes are applied
      window.location.assign("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated: isAuthenticated,
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