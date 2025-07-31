import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authChecked, setAuthChecked] = useState(false);
  
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes - reduce frequent checks
    cacheTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false, // Prevent excessive calls
    refetchOnMount: !authChecked, // Only refetch on mount if not checked
    enabled: !authChecked, // Control when query runs
    onSettled: () => {
      setAuthChecked(true);
    }
  });

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading && !authChecked,
    isAuthenticated: !!user,
    refetchUser: () => {
      setAuthChecked(false);
      refetch();
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}