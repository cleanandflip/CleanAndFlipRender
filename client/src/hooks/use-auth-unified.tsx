// Unified authentication hook with reliable session handling
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

type AuthResponse = {
  authenticated: boolean;
  user: any | null;
  session: {
    id: string;
    guest: boolean;
    error?: boolean;
  };
};

// Reliable user fetcher with credentials
const fetchUser = async (): Promise<AuthResponse> => {
  const response = await fetch('/api/user', {
    credentials: 'include',
    headers: { 
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    },
    cache: 'no-store'
  });

  // Always expect 200 from unified auth endpoint
  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export function useUnifiedAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: fetchUser,
    staleTime: 0, // Always fresh to prevent "stuck" states
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: (failureCount, error: any) => {
      // Only retry server errors, not client errors
      const status = error?.message?.match(/^(\d+):/)?.[1];
      if (status && status.startsWith('5')) {
        return failureCount < 2;
      }
      return false;
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear all cached auth data immediately
      queryClient.setQueryData(['auth'], { 
        authenticated: false, 
        user: null, 
        session: { id: '', guest: true } 
      });
      
      // Invalidate auth queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      // Clear local storage that might keep UI "logged in"
      localStorage.removeItem('cartOwnerId');   // CART V2
      localStorage.removeItem('cf_address');    // Locality system
      localStorage.removeItem('user');          // Legacy user cache
      sessionStorage.clear();

      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });

      // Hard navigate to ensure clean state
      window.location.assign('/');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      toast({
        title: "Logout error",
        description: "There was an issue signing out. Please try again.",
        variant: "destructive"
      });
    }
  });
}